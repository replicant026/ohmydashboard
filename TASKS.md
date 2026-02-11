# OhMyDashboard — Tasks

> Generated from BRIEF.md. All 6 phases complete.

---

## Phase 1: MVP (Core Dashboard) ✅

### 1. Project Scaffolding ✅
- [x] 1.1 Initialize Vite + React 19 + TypeScript project
- [x] 1.2 Install and configure Tailwind CSS v4 (`@tailwindcss/vite`)
- [x] 1.3 Install Recharts for charting + Lucide React for icons
- [x] 1.4 Install Hono + @hono/node-server for backend API server
- [x] 1.5 Configure path aliases (`@/` → `src/`), proxy, concurrent dev scripts
- [x] 1.6 Set up project structure (components/dashboard, hooks, lib, types, server/)

### 2. TypeScript Types & Data Layer ✅
- [x] 2.1 Define types: `Session`, `AgentActivity`, `DashboardStats`, `AgentUsage` (`src/types/opencode.ts`)
- [x] 2.2 Create realistic mock data in server (9 agents, 6 sessions, real directories)
- [x] 2.3 Build custom hook `useDashboardData` with auto-refresh + countdown

### 3. Backend API Server ✅
- [x] 3.1 Create Hono server (`server/index.ts`) on port 3456 with CORS
- [x] 3.2 API routes: `GET /api/stats`, `GET /api/agents/active`, `GET /api/sessions`, `GET /api/agents/usage`
- [x] 3.3 Mock data simulates realistic agent activity with randomized elapsed times
- [x] 3.4 Concurrent dev script: `npm run dev` starts Vite + Hono together

### 4. Dashboard UI — Summary Cards ✅
- [x] 4.1 4 cards: Total Sessions, Total Messages, Total Cost, Active Agents
- [x] 4.2 Icons from Lucide React, loading skeleton states
- [x] 4.3 Dark zinc-900 card style with accent icon colors

### 5. Dashboard UI — Active Agents Table ✅
- [x] 5.1 Table with columns: Status, Agent, Directory, Model, Msgs, Elapsed
- [x] 5.2 Color-coded status dots (green=running, amber=idle, gray=completed)
- [x] 5.3 Agent name badges with per-agent color coding
- [x] 5.4 Sorted by status priority (running → idle → completed)

### 6. Dashboard UI — Session Timeline ✅
- [x] 6.1 Recent sessions list with expandable rows
- [x] 6.2 Shows: truncated session ID, directory, time ago, message count, cost
- [x] 6.3 Agent badges per session with unique colors

### 7. Dashboard UI — Agent Leaderboard ✅
- [x] 7.1 CSS progress bars (replaced Recharts — more reliable in dark mode)
- [x] 7.2 All 9 agents shown: name, colored dot, message count, percentage
- [x] 7.3 Bar width proportional to usage percentage, agent-specific colors

### 8. Dashboard Layout & Polish ✅
- [x] 8.1 Sticky header with "OhMyDashboard" + version badge + refresh button
- [x] 8.2 5-column grid (3 for agents, 2 for leaderboard), responsive
- [x] 8.3 Dark mode by default (zinc-950 bg, zinc-900 cards, zinc-800 borders)
- [x] 8.4 Auto-refresh every 15s with countdown timer in header

### 9. Integration & Testing ✅
- [x] 9.1 Frontend connected to backend via Vite proxy (`/api` → localhost:3456)
- [x] 9.2 Verified with browser automation — all panels render correctly
- [x] 9.3 Build passes (`vite build` — no TS errors)
- [ ] 9.4 Connect to real OpenCode CLI data (requires CLI adapter — Phase 3)

---

## Phase 2: Analytics & Polish ✅

### 10. Extended Types & API ✅
- [x] 10.1 Added Phase 2 types: `CostHistoryEntry`, `ModelUsage`, `HourlyActivity`, `SessionMessage`, `DateRange`
- [x] 10.2 New API endpoints: `GET /api/cost-history`, `GET /api/models`, `GET /api/activity`, `GET /api/sessions/:id/messages`
- [x] 10.3 Date range filtering (`?range=today|week|month|all`) on stats, sessions, usage endpoints
- [x] 10.4 Mock data: 14-day cost history, 6 AI models, 7×24 hourly activity grid, session messages

### 11. Cost Tracking Chart ✅
- [x] 11.1 Recharts AreaChart with green gradient fill
- [x] 11.2 Custom tooltip showing cost, sessions, messages per day
- [x] 11.3 14-day total displayed in header

### 12. Model Distribution ✅
- [x] 12.1 Recharts PieChart donut (inner 40, outer 70) with colored cells
- [x] 12.2 Legend with model names, colored dots, and percentages
- [x] 12.3 Header shows total messages and cost

### 13. Activity Heatmap ✅
- [x] 13.1 Pure CSS 7×24 grid (Sun–Sat × 0–23h)
- [x] 13.2 Emerald intensity scale (4 levels + empty)
- [x] 13.3 GitHub-style with Less/More legend
- [x] 13.4 Hover tooltips showing day, time, message count

### 14. Session Detail View ✅
- [x] 14.1 Click-to-expand sessions with chevron toggle
- [x] 14.2 Fetches `/api/sessions/:id/messages` on expand
- [x] 14.3 Message timeline with user/bot icons, agent name, model, cost, timestamp
- [x] 14.4 Scrollable message container (max-height 320px)

### 15. Date Range Filtering ✅
- [x] 15.1 Segmented button group in header (Today/Week/Month/All)
- [x] 15.2 Filters stats, sessions, and agent usage by date range
- [x] 15.3 Updated `useDashboardData` hook to pass range to all relevant endpoints

### 16. Integration & Testing ✅
- [x] 16.1 Updated `useDashboardData` hook: fetches 7 endpoints (stats, agents, sessions, usage, costHistory, models, activity)
- [x] 16.2 Build passes (`vite build` — 2353 modules, no TS errors)
- [x] 16.3 Verified with browser automation — all Phase 2 panels render correctly
- [x] 16.4 Version bumped to v0.2.0

---

## Phase 3: Real Data Integration ✅

### 17. Direct Filesystem Reader ✅
- [x] 17.1 Discovered OpenCode stores ALL data as JSON at `~/.local/share/opencode/storage/`
- [x] 17.2 Created `server/opencode-reader.ts` — reads session, message, part, project JSON files directly
- [x] 17.3 Raw types: `RawSession`, `RawMessage`, `RawPart`, `RawProject` matching OpenCode's on-disk format
- [x] 17.4 10 transform methods converting raw data → dashboard types (sessions, stats, usage, cost, models, heatmap)
- [x] 17.5 Active agent detection: sessions updated within last 5 minutes
- [x] 17.6 Graceful error handling: malformed/missing JSON files silently skipped

### 18. In-Memory Cache ✅
- [x] 18.1 Created `server/cache.ts` — generic `TTLCache<T>` class with 30s default TTL
- [x] 18.2 All reader methods cached to avoid re-reading thousands of files per request
- [x] 18.3 Cache invalidation via `invalidateCache()` method

### 19. Server Rewrite ✅
- [x] 19.1 Rewrote `server/index.ts` — removed ALL mock data (370→65 lines)
- [x] 19.2 All 8 endpoints now return real data from OpenCode storage
- [x] 19.3 Date range filtering preserved (?range=today|week|month|all)
- [x] 19.4 Session messages endpoint reads actual message parts for content

### 20. Types Update ✅
- [x] 20.1 Added `tokens?: { input: number; output: number; reasoning: number }` to `SessionMessage`

### 21. Verification ✅
- [x] 21.1 Build passes (`tsc -b && vite build` — 2353 modules, no errors)
- [x] 21.2 All 8 API endpoints tested with real data: 196 sessions, 5,015 messages
- [x] 21.3 Real agent distribution: sisyphus (90%), build (7%), explore/librarian/sisyphus-junior
- [x] 21.4 Real model distribution: claude-opus-4-5-thinking (64%), claude-opus-4-6-thinking (24%)
- [x] 21.5 Cost data shows $0 — accurate (vibeproxy providers don't report costs)

### Future Enhancements
- [ ] SSE real-time updates (OpenCode has SSE in sst/opencode-sdk-go)
- [ ] Cost estimation from token counts (when providers don't report cost)
- [ ] Agent performance metrics (time to complete)
- [ ] Export data to CSV/JSON
- [ ] Multi-project comparison view

---

## Phase 4: Session Table with Pagination & Filters ✅

### 22. TanStack Table Integration ✅
- [x] 22.1 Installed `@tanstack/react-table` v8
- [x] 22.2 Created `SessionTable.tsx` replacing `SessionTimeline.tsx`
- [x] 22.3 Column definitions: Title, Directory, Agents, Messages, Cost, Updated
- [x] 22.4 All columns sortable (click header to toggle asc/desc/none)

### 23. Pagination ✅
- [x] 23.1 Client-side pagination with page size selector (10/20/50)
- [x] 23.2 Previous/Next page navigation buttons
- [x] 23.3 Page info display ("Page X of Y")
- [x] 23.4 Showing row range ("Showing 1-10 of 196 sessions")

### 24. Filtering ✅
- [x] 24.1 Global search input — fuzzy matches across title, directory, agents, ID
- [x] 24.2 Agent dropdown filter — multi-select with checkboxes, auto-populated from data
- [x] 24.3 Directory dropdown filter — select from unique project directories
- [x] 24.4 Active filter tags with click-to-remove
- [x] 24.5 "Clear all" button when filters are active

### 25. Expandable Row Detail ✅
- [x] 25.1 Click row to expand/collapse message view (preserved from SessionTimeline)
- [x] 25.2 Fetches `/api/sessions/:id/messages` on expand
- [x] 25.3 Message timeline with user/assistant icons, agent, model, cost, timestamp

### 26. Build & Verify ✅
- [x] 26.1 Build passes (`tsc -b && vite build` — 2355 modules, no errors)
- [x] 26.2 Bundle: 636KB JS, 34KB CSS

---

## Phase 5: Branding & Equal Height Layout ✅

### 27. Custom Logo & Favicon ✅
- [x] 27.1 Created custom SVG logo (`src/components/Logo.tsx`) — radar/monitoring motif with emerald accents
- [x] 27.2 Logo design: 2 concentric rings, center dot, radar sweep line, 3 agent indicator dots
- [x] 27.3 Created SVG favicon (`public/favicon.svg`) matching logo design
- [x] 27.4 Updated `index.html` — new favicon path + page title "OhMyDashboard — Agent Monitor"
- [x] 27.5 Replaced emoji logo in header with inline SVG `<Logo />` component
- [x] 27.6 Version bumped to v0.4.0

### 28. Equal Height Columns ✅
- [x] 28.1 Added `h-full flex flex-col` to all 5 dashboard card components
- [x] 28.2 Components fixed: ActiveAgents, AgentLeaderboard, CostChart, ModelDistribution, ActivityHeatmap
- [x] 28.3 Loading state wrappers also use `h-full flex flex-col` for consistency
- [x] 28.4 CSS Grid's implicit `items-stretch` + component `h-full` ensures equal row heights

### 29. Build & Verify ✅
- [x] 29.1 Build passes (`tsc -b && vite build` — 2356 modules, no errors)
- [x] 29.2 Bundle: 637KB JS, 33KB CSS

---

## Phase 6: Total Tokens Metric ✅

### 31. Token Tracking ✅
- [x] 31.1 Added `totalTokens` field to `DashboardStats` type (both server and client)
- [x] 31.2 Updated `getStats()` in opencode-reader to sum input+output+reasoning tokens from all messages
- [x] 31.3 Tokens computed per date range filter (today/week/month/all)
- [x] 31.4 Added 5th summary card "Total Tokens" with Coins icon (cyan accent)
- [x] 31.5 `formatTokens()` helper for human-readable display (K/M/B)
- [x] 31.6 Grid updated from 4 to 5 columns (`lg:grid-cols-5`)
- [x] 31.7 Verified: 275.9M tokens across all sessions (real data)
- [x] 31.8 Build passes (2356 modules, no errors)

---

## Architecture

```
ohmydashboard/
├── BRIEF.md                        # Project brief
├── TASKS.md                        # This file
├── package.json                    # Vite + React 19 + Tailwind v4 + Hono + TanStack Table
├── vite.config.ts                  # Tailwind plugin, @/ alias, proxy
├── tsconfig.app.json               # Strict TS, path aliases
├── src/
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Tailwind v4 import + dark theme
│   ├── App.tsx                     # Main dashboard layout (v0.4.0)
│   ├── types/opencode.ts           # TypeScript interfaces (Phase 1-4)
│   ├── lib/utils.ts                # formatCost, formatTimeAgo, cn()
│   ├── hooks/useDashboardData.ts   # Auto-refresh data fetcher (7 endpoints)
│   ├── components/Logo.tsx          # Custom SVG logo component (NEW)
│   └── components/dashboard/
│       ├── SummaryCards.tsx         # 5 stat cards (sessions, messages, tokens, cost, active)
│       ├── ActiveAgents.tsx        # Agent activity table
│       ├── SessionTable.tsx        # TanStack Table with pagination + filters (NEW)
│       ├── SessionTimeline.tsx     # Legacy expandable sessions (replaced)
│       ├── AgentLeaderboard.tsx    # Agent usage bar chart (CSS)
│       ├── CostChart.tsx           # 14-day cost area chart (Recharts)
│       ├── ModelDistribution.tsx   # Model usage donut chart (Recharts)
│       └── ActivityHeatmap.tsx     # 7×24 activity grid (CSS)
└── server/
    ├── index.ts                    # Hono API server (8 endpoints, port 3456)
    ├── opencode-reader.ts          # Reads OpenCode JSON storage directly
    └── cache.ts                    # Generic TTL cache (30s default)
```

## Commands

```bash
npm run dev          # Start both Vite + API server
npm run dev:frontend # Vite only (port 5174)
npm run dev:server   # Hono API only (port 3456)
npm run build        # Production build
```
