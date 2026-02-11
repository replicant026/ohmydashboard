# GUIDE.md — Packaging OhMyDashboard as a `bunx` Executable

> How to make `bunx ohmydashboard@latest` launch the dashboard instantly.

---

## Reference: How `oh-my-opencode-dashboard` Does It

WilliamJudge94's project uses an elegantly simple approach:

```
User runs: bunx oh-my-opencode-dashboard@latest
                    │
                    ▼
        npm registry downloads package
                    │
                    ▼
        Bun executes bin entry (start.ts)
                    │
                    ▼
    ┌───────────────┴───────────────┐
    │  Hono API server (port 51234) │
    │  + serves pre-built dist/     │
    │  (Vite SPA output)            │
    └───────────────────────────────┘
```

**Key decisions:**
1. `bin` points to raw `.ts` file — Bun runs TypeScript natively
2. `dist/` is pre-built via `prepublishOnly` script before `npm publish`
3. Server uses `Bun.serve()` + Hono for both API and static file serving
4. No compilation step for the server — ship source `.ts` files directly

---

## Implementation Plan for OhMyDashboard

### Current Architecture

```
ohmydashboard/
├── server/
│   ├── index.ts              # Hono API (port 3456)
│   ├── opencode-reader.ts    # Reads ~/.local/share/opencode/storage/
│   └── cache.ts              # TTL cache
├── src/                      # React 19 + Vite frontend
├── dist/                     # Vite build output (after npm run build)
└── package.json
```

### Target Architecture

```
ohmydashboard/
├── bin/
│   └── cli.ts                # NEW — CLI entry point (#!/usr/bin/env bun)
├── server/
│   ├── index.ts              # Hono API (unchanged logic)
│   ├── opencode-reader.ts    # Reads OpenCode storage
│   └── cache.ts              # TTL cache
├── src/                      # React frontend (shipped for dev, dist/ for prod)
├── dist/                     # Pre-built Vite SPA (included in npm package)
└── package.json              # Updated with bin, files, prepublishOnly
```

---

## Step-by-Step Implementation

### Step 1: Create `bin/cli.ts`

This is the entry point that `bunx` will execute.

```typescript
#!/usr/bin/env bun

import { parseArgs } from "util";
import { join } from "path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { OpenCodeReader } from "../server/opencode-reader";
import type { DateRange } from "../server/opencode-reader";

// Parse CLI arguments
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: { type: "string", short: "p", default: "3456" },
    host: { type: "string", short: "h", default: "127.0.0.1" },
  },
  strict: false,
  allowPositionals: true,
});

const PORT = parseInt(values.port ?? "3456", 10);
const HOST = values.host ?? "127.0.0.1";

// Create API
const app = new Hono();
app.use("/api/*", cors());
const reader = new OpenCodeReader();

// Mount all API routes (same as server/index.ts)
app.get("/api/stats", async (c) => {
  const range = (c.req.query("range") || "all") as DateRange;
  return c.json(await reader.getStats(range));
});

app.get("/api/agents/active", async (c) => {
  return c.json(await reader.getActiveAgents());
});

app.get("/api/sessions", async (c) => {
  const range = (c.req.query("range") || "all") as DateRange;
  return c.json(await reader.getSessions(range));
});

app.get("/api/sessions/:id/messages", async (c) => {
  const id = c.req.param("id");
  return c.json(await reader.getSessionDetail(id));
});

app.get("/api/agents/usage", async (c) => {
  const range = (c.req.query("range") || "all") as DateRange;
  return c.json(await reader.getAgentUsage(range));
});

app.get("/api/cost-history", async (c) => {
  return c.json(await reader.getCostHistory());
});

app.get("/api/models", async (c) => {
  return c.json(await reader.getModelUsage());
});

app.get("/api/activity", async (c) => {
  return c.json(await reader.getHourlyActivity());
});

// Serve pre-built SPA from dist/
const DIST_DIR = join(import.meta.dir, "../dist");

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js":   "text/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
};

// Catch-all: serve static files or SPA fallback
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(DIST_DIR, pathname);

  // Try to serve the exact file
  const file = Bun.file(filePath);
  if (await file.exists()) {
    const ext = pathname.substring(pathname.lastIndexOf("."));
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  }

  // SPA fallback — serve index.html for client-side routing
  const indexFile = Bun.file(join(DIST_DIR, "index.html"));
  if (await indexFile.exists()) {
    return new Response(indexFile, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return c.notFound();
});

// Start server
const server = Bun.serve({
  fetch: app.fetch,
  hostname: HOST,
  port: PORT,
});

console.log(`
  ╔══════════════════════════════════════╗
  ║       OhMyDashboard v0.4.0          ║
  ║   Agent Monitor for OpenCode        ║
  ╠══════════════════════════════════════╣
  ║                                     ║
  ║   → http://${HOST}:${PORT}          ║
  ║                                     ║
  ║   Press Ctrl+C to stop              ║
  ╚══════════════════════════════════════╝
`);
```

### Step 2: Update `package.json`

Add/modify these fields:

```jsonc
{
  "name": "ohmydashboard",           // npm package name (must be available)
  "version": "0.4.0",
  "type": "module",
  "bin": {
    "ohmydashboard": "./bin/cli.ts"  // CLI entry point
  },
  "files": [
    "bin",                           // CLI entry
    "server",                        // API server (TS source — Bun runs it directly)
    "dist",                          // Pre-built Vite SPA
    "package.json"
  ],
  "engines": {
    "bun": ">=1.1.0"                 // Bun-only (for TS execution + Bun.serve)
  },
  "scripts": {
    "build": "tsc -b && vite build",
    "build:ui": "vite build",
    "prepublishOnly": "npm run build:ui"  // Auto-build dist/ before publish
  }
}
```

**Key points:**
- `bin` points to `.ts` file — Bun executes TypeScript natively
- `files` includes `bin/`, `server/`, and `dist/` — only what's needed at runtime
- `prepublishOnly` ensures `dist/` is always fresh when publishing
- `src/` is NOT included in `files` — users don't need React source code

### Step 3: Fix Vite Config for Production

In `vite.config.ts`, ensure the build output goes to `dist/` and the base path is correct:

```typescript
export default defineConfig({
  // ... existing config
  base: "./",  // Relative paths so it works when served from any location
  build: {
    outDir: "dist",
    emptyDir: true,
  },
});
```

The `base: "./"` is critical — it makes all asset paths relative so the SPA works when served from `Bun.file()` regardless of where the package is installed.

### Step 4: Handle API Proxy in Production

In development, Vite proxies `/api` to `localhost:3456`. In production (bunx), the API and SPA are on the SAME server, so no proxy is needed.

The frontend already uses relative `/api/...` URLs in `useDashboardData.ts`, so this works automatically — the browser sends requests to the same origin.

**No changes needed** in the frontend code.

### Step 5: Test Locally

```bash
# 1. Build the frontend
npm run build:ui

# 2. Run the CLI entry point directly
bun bin/cli.ts

# 3. Open http://localhost:3456
# → Should show the dashboard with real data

# 4. Test with custom port
bun bin/cli.ts --port 8080
```

### Step 6: Publish to npm

```bash
# 1. Login to npm
npm login
# or: bunx npm login

# 2. Check package name availability
npm view ohmydashboard
# 404 = available!

# 3. Publish
npm publish
# prepublishOnly will auto-run: npm run build:ui

# 4. Test it
bunx ohmydashboard@latest
```

---

## Decision Points

### Bun-only vs Node.js Compatible

| Approach | Pros | Cons |
|----------|------|------|
| **Bun-only** (recommended) | No build step for server, TS natively, `Bun.serve()` is fast, simple | Users must have Bun installed |
| **Node.js compatible** | Wider audience | Need to compile server TS → JS (tsup/esbuild), use `@hono/node-server`, more complex packaging |

**Recommendation**: Go Bun-only like the reference project. `bunx` implies Bun is installed. If Node.js support is wanted later, add a `npx` entry that uses compiled JS.

### Package Name Options

| Name | Style |
|------|-------|
| `ohmydashboard` | Short, clean |
| `oh-my-dashboard` | Matches oh-my-opencode pattern |
| `opencode-dashboard` | Descriptive |
| `@yourname/ohmydashboard` | Scoped (always available) |

### Port Selection

| Port | Rationale |
|------|-----------|
| 3456 | Current default, unlikely to conflict |
| 51234 | Same as reference project |
| 0 | Auto-assign (let OS pick) |

---

## Dual Mode: Development vs Production

After this change, the project supports two modes:

### Development Mode (existing)
```bash
npm run dev
# Vite dev server (HMR) on :5174
# Hono API server on :3456
# Vite proxies /api → :3456
```

### Production / CLI Mode (new)
```bash
bunx ohmydashboard
# Single Hono server on :3456
# Serves pre-built dist/ + API on same port
# No Vite, no proxy, no HMR
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `bin/cli.ts` | **CREATE** | CLI entry point with Bun.serve + Hono + static serving |
| `package.json` | **MODIFY** | Add `bin`, `files`, `engines`, `prepublishOnly` |
| `vite.config.ts` | **MODIFY** | Add `base: "./"` for relative asset paths |
| No frontend changes needed | — | `/api/` URLs already relative |

---

## Advanced: Node.js Support (Optional, Future)

If you want `npx ohmydashboard` to work (without Bun):

1. Add `tsup` to bundle `bin/cli.ts` → `dist/cli.mjs` (compiled JS)
2. Change `bin` to point to compiled JS: `"bin": { "ohmydashboard": "./dist/cli.mjs" }`
3. Replace `Bun.serve()` with `@hono/node-server`'s `serve()`:
   ```typescript
   import { serve } from "@hono/node-server";
   import { serveStatic } from "@hono/node-server/serve-static";
   serve({ fetch: app.fetch, hostname: HOST, port: PORT });
   ```
4. Replace `Bun.file()` with Node.js `fs.readFile()` + `createReadStream()`
5. Add both entries to `bin`:
   ```json
   "bin": {
     "ohmydashboard": "./dist/cli.mjs",
     "ohmydashboard-bun": "./bin/cli.ts"
   }
   ```

This is more complex but makes the package universally runnable. Do this only if there's demand.

---

## Checklist Before Publishing

- [ ] `bin/cli.ts` created and tested locally (`bun bin/cli.ts`)
- [ ] `package.json` updated with `bin`, `files`, `engines`, `prepublishOnly`
- [ ] `vite.config.ts` has `base: "./"` 
- [ ] `npm run build:ui` produces `dist/` with `index.html` and assets
- [ ] Dashboard loads correctly at `http://localhost:3456` from CLI
- [ ] All 8 API endpoints return real data
- [ ] `npm pack` to verify package contents (should include bin/, server/, dist/)
- [ ] `npm publish` with `--dry-run` first
- [ ] Test with `bunx ohmydashboard@latest` after publish
