# OhMyDashboard — Project Brief

> A lightweight monitoring dashboard for OhMyOpenCode agent activity.

---

## 1. Problem Statement

OhMyOpenCode enables **parallel background AI agents** (explore, librarian, oracle, prometheus, etc.) that work simultaneously across directories. But there's **zero visibility** into:

- Which agents are currently running
- What they're working on (which directory/project)
- How much they cost (per session, per agent)
- Usage patterns over time

The user has to "trust the process" blindly. This dashboard fixes that.

---

## 2. Target User

Developers using **OpenCode v1.1.53+** with the **oh-my-opencode plugin (v3.5.0+)** who run multiple parallel agent sessions and want operational visibility.

---

## 3. Data Sources

### 3.1 OpenCode Session API (Primary)

OpenCode exposes session data via built-in tools:

| API | Returns |
|-----|---------|
| `session_list` | Session ID, message count, first/last dates, agents used |
| `session_info` | Session details, agents list, has_todos, has_transcript (entry count) |
| `session_read` | Full message history with role, timestamp, content |
| `session_search` | Full-text search across all sessions |

### 3.2 OpenCode SDK Data Model (sst/opencode-sdk-go)

```
Session {
  ID, Directory, ProjectID, Title,
  Time: { Created, Updated, Compacting }
}

AssistantMessage {
  ID, Cost (float64), Mode (string), ModelID (string),
  ParentID, Role, SessionID,
  Time: { Created, Completed }
}
```

**Key**: `AssistantMessage.Cost` = pre-calculated cost per message. No raw token counts available.

### 3.3 Agent Configuration (~/.config/opencode/oh-my-opencode.json)

**9 Agents**: sisyphus, oracle, librarian, explore, multimodal-looker, prometheus, metis, momus, atlas

**7 Categories**: visual-engineering, ultrabrain, artistry, quick, unspecified-low, unspecified-high, writing

Each has model config (model name, reasoning effort level).

### 3.4 Storage Reality

- **No local SQLite** — OpenCode doesn't persist sessions to disk as databases
- Data is accessible via API/CLI, not file system
- `.opencode/` directories contain only config, memory, and skills (no session data)

---

## 4. Core Features (MVP)

### 4.1 Active Agents Panel
- **What**: Real-time list of running agents with status indicators
- **Shows**: Agent name, directory/project, status (running/idle/completed), elapsed time
- **Data**: Poll `session_list` + `session_info` for active sessions
- **UI**: Table with colored status badges

### 4.2 Cost Tracker
- **What**: Total cost breakdown
- **Shows**: Total cost (today/this week/all time), cost per session, cost per agent type
- **Data**: Aggregate `AssistantMessage.Cost` across sessions via `session_read`
- **UI**: Summary cards + bar chart

### 4.3 Agent Usage Leaderboard
- **What**: Most-used agents ranked
- **Shows**: Agent name, invocation count, total messages, percentage of total
- **Data**: Count agent occurrences from `session_list` agents field
- **UI**: Horizontal bar chart / ranked list

### 4.4 Session Timeline
- **What**: Recent sessions overview
- **Shows**: Session title, directory, message count, duration, agents used, cost
- **Data**: `session_list` with details from `session_info`
- **UI**: Timeline / table with expandable rows

### 4.5 Model Distribution
- **What**: Which AI models are being used most
- **Shows**: Model name, message count, cost contribution
- **Data**: Parse `AssistantMessage.ModelID` from session messages
- **UI**: Donut chart

### 4.6 Activity Heatmap (Simple)
- **What**: When are agents most active
- **Shows**: Messages per hour over the past 7 days
- **Data**: Timestamps from `session_read`
- **UI**: GitHub-style contribution grid

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Build** | Vite | Fast, already used in `focus/` project |
| **Framework** | React 19 | Already in user's stack |
| **UI Library** | shadcn/ui + Tailwind CSS | Already in `focus/`, beautiful defaults |
| **Charts** | Recharts or Tremor | Lightweight, React-native charting |
| **Data** | CLI adapter + JSON | Shell out to `opencode` CLI for data |
| **State** | Zustand or React Query | Lightweight, polling-friendly |
| **Runtime** | Node.js (dev server) | Proxies CLI calls to frontend |

### Architecture

```
┌─────────────────────────────────────┐
│         React Dashboard (Vite)       │
│  ┌──────┐ ┌──────┐ ┌──────────────┐ │
│  │Cards │ │Charts│ │ Agent Table   │ │
│  └──────┘ └──────┘ └──────────────┘ │
└────────────────┬────────────────────┘
                 │ HTTP/fetch
     ┌───────────┴───────────┐
     │   Express/Hono Server  │
     │   (thin API layer)     │
     └───────────┬───────────┘
                 │ exec/spawn
     ┌───────────┴───────────┐
     │   OpenCode CLI / API   │
     │   session_list, etc.   │
     └───────────────────────┘
```

**Data flow**: Dashboard polls a lightweight API server (Express/Hono) every N seconds. The server shells out to the OpenCode CLI or calls the Go SDK API to fetch session data, transforms it, and returns JSON.

---

## 6. UI Layout

```
┌──────────────────────────────────────────────────┐
│  OhMyDashboard                        🔄 Refresh │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ │
│  │ Sessions │ │ Messages │ │ Cost     │ │Agents│ │
│  │   12     │ │  1,847   │ │ $4.23    │ │  6   │ │
│  │ Total    │ │ Total    │ │ Today    │ │Active│ │
│  └──────────┘ └──────────┘ └──────────┘ └─────┘ │
│                                                  │
│  ┌──────────────────────┐ ┌────────────────────┐ │
│  │ Active Agents        │ │ Agent Leaderboard  │ │
│  │ ● sisyphus  /SysArch │ │ ███████ sisyphus   │ │
│  │ ● explore   /SysArch │ │ █████   oracle     │ │
│  │ ● librarian /SysArch │ │ ████    explore    │ │
│  │ ○ oracle    idle      │ │ ███     librarian  │ │
│  └──────────────────────┘ └────────────────────┘ │
│                                                  │
│  ┌──────────────────────┐ ┌────────────────────┐ │
│  │ Session Timeline     │ │ Model Distribution │ │
│  │ ses_3b4f.. 33msgs $2 │ │    ◉ claude-4.5    │ │
│  │ ses_3b74.. 432msgs $8│ │    ◉ gpt-5.2       │ │
│  │ ses_3be5.. 265msgs $5│ │    ◉ gemini-3      │ │
│  └──────────────────────┘ └────────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │ Activity Heatmap (7 days)                    │ │
│  │ ░░▓▓██░░▓▓████▓▓░░░░▓▓████▓▓░░░░▓▓██       │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1 — MVP (Core Dashboard)
1. Project scaffolding: Vite + React + Tailwind + shadcn/ui
2. Backend API server (Hono/Express) with OpenCode CLI adapter
3. Summary cards (sessions, messages, cost, active agents)
4. Active agents table with status
5. Session list with details
6. Agent usage leaderboard (bar chart)
7. Auto-refresh (polling every 10-30s)

### Phase 2 — Analytics & Polish
1. Cost tracking chart (daily/weekly breakdown)
2. Model distribution donut chart
3. Activity heatmap
4. Session detail view (expand to see messages)
5. Date range filtering
6. Dark mode (match OpenCode web aesthetic)

### Phase 3 — Advanced (Future)
1. Real-time updates via SSE (if OpenCode supports it)
2. Cost alerts / budget warnings
3. Agent performance metrics (time to complete)
4. Export data to CSV/JSON
5. Multi-project comparison view

---

## 8. Known Constraints & Risks

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| No raw token counts in API | Can't show input/output tokens separately | Show pre-calculated `Cost` instead |
| No SQLite persistence | Can't query historical data directly | Cache session data in local JSON/SQLite |
| CLI-based data access | Slower than direct DB queries | Add caching layer, longer poll intervals |
| Active agent detection | No explicit "running" status API | Infer from session timestamps + recent activity |
| Background agents invisible | No dedicated background task API | Parse session transcripts for task spawns |
| Rate limiting | Frequent polling could be expensive | Smart polling: fast when active, slow when idle |

---

## 9. Data Collection Strategy

Since OpenCode doesn't have a dedicated monitoring API, we need a creative approach:

### Option A: CLI Wrapper (Recommended for MVP)
```bash
# List sessions
opencode session list --json

# Get session details
opencode session info <session_id> --json
```
The API server wraps these CLI calls and caches results.

### Option B: OpenCode Go SDK
Build a Go sidecar that uses `sst/opencode-sdk-go` to poll the API directly. More robust but requires Go tooling.

### Option C: File System Watcher (Supplementary)
Watch `.opencode/memory/` directories for changes as a signal of agent activity. Lightweight but limited data.

### Recommendation
**Start with Option A** (CLI wrapper) for MVP. It's the simplest path to working data. Migrate to Option B (SDK) if performance becomes an issue.

---

## 10. Project Structure

```
ohmydashboard/
├── BRIEF.md                # This file
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── ActiveAgents.tsx
│   │   │   ├── SessionTimeline.tsx
│   │   │   ├── AgentLeaderboard.tsx
│   │   │   ├── ModelDistribution.tsx
│   │   │   └── ActivityHeatmap.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/
│   │   ├── useSessionData.ts
│   │   ├── useAgentMetrics.ts
│   │   └── useCostTracker.ts
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── utils.ts
│   └── types/
│       └── opencode.ts      # TypeScript types for OpenCode data
├── server/
│   ├── index.ts             # Hono/Express API server
│   ├── opencode-adapter.ts  # CLI wrapper for OpenCode
│   └── cache.ts             # Simple in-memory cache
└── public/
```

---

## 11. Success Criteria

- [ ] Can see all active sessions and which agents are running
- [ ] Can see total cost (today, this week, all time)
- [ ] Can see which agents are used most
- [ ] Dashboard auto-refreshes without manual intervention
- [ ] Loads in < 2 seconds
- [ ] Works while OpenCode is actively running sessions
