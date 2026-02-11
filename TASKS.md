# OhMyDashboard — Tasks

> Generated from BRIEF.md. Phase 1 MVP implementation complete.

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
- [ ] 9.4 Connect to real OpenCode CLI data (requires CLI adapter — Phase 2)

---

## Phase 2: Analytics & Real Data (Next)

### 10. Real Data Integration
- [ ] 10.1 Build OpenCode CLI adapter (`server/opencode-adapter.ts`)
- [ ] 10.2 Wrap `opencode session list --json` and `opencode session info --json`
- [ ] 10.3 Add in-memory cache with TTL for CLI results
- [ ] 10.4 Replace mock data with real CLI output

### 11. Cost Tracking Chart
- [ ] 11.1 Daily/weekly cost breakdown line chart
- [ ] 11.2 Cost per agent stacked bar chart

### 12. Model Distribution
- [ ] 12.1 Donut chart showing model usage (claude, gpt, gemini)
- [ ] 12.2 Cost contribution per model

### 13. Activity Heatmap
- [ ] 13.1 GitHub-style contribution grid (7 days × 24 hours)
- [ ] 13.2 Color intensity based on message volume

### 14. Session Detail View
- [ ] 14.1 Click session to expand and see messages
- [ ] 14.2 Message timeline with role/content/timestamp

### 15. Date Range Filtering
- [ ] 15.1 Date picker for filtering sessions
- [ ] 15.2 Today/Week/Month preset buttons

---

## Phase 3: Advanced (Future)

- [ ] SSE real-time updates (if OpenCode supports it)
- [ ] Cost alerts / budget warnings
- [ ] Agent performance metrics (time to complete)
- [ ] Export data to CSV/JSON
- [ ] Multi-project comparison view

---

## Architecture

```
ohmydashboard/
├── BRIEF.md                        # Project brief
├── TASKS.md                        # This file
├── package.json                    # Vite + React 19 + Tailwind v4 + Hono
├── vite.config.ts                  # Tailwind plugin, @/ alias, proxy
├── tsconfig.app.json               # Strict TS, path aliases
├── src/
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Tailwind v4 import + dark theme
│   ├── App.tsx                     # Main dashboard layout
│   ├── types/opencode.ts           # TypeScript interfaces
│   ├── lib/utils.ts                # formatCost, formatTimeAgo, cn()
│   ├── hooks/useDashboardData.ts   # Auto-refresh data fetcher
│   └── components/dashboard/
│       ├── SummaryCards.tsx         # 4 stat cards
│       ├── ActiveAgents.tsx        # Agent activity table
│       ├── SessionTimeline.tsx     # Recent sessions list
│       └── AgentLeaderboard.tsx    # Agent usage bar chart
└── server/
    └── index.ts                    # Hono API server (port 3456)
```

## Commands

```bash
npm run dev          # Start both Vite + API server
npm run dev:frontend # Vite only (port 5174)
npm run dev:server   # Hono API only (port 3456)
npm run build        # Production build
```
