# OhMyDashboard

Agent monitoring dashboard for [OpenCode](https://opencode.ai) and [OhMyOpenCode](https://github.com/ohmyopencode).

See which agents are running, how many tokens you've burned, and what your sessions look like — all in one place.

![OhMyDashboard](screenshot.png)

## Quick Start

```bash
bunx ohmydashboard@latest
```

Opens at [http://127.0.0.1:51234](http://127.0.0.1:51234). That's it.

### Options

```bash
bunx ohmydashboard --port 8080       # custom port
bunx ohmydashboard --host 0.0.0.0    # expose to network
```

## Features

- **5 Summary Cards** — Total sessions, messages, tokens, cost, and active agents at a glance
- **Active Agents** — Live view of running agents with model, directory, message count, and elapsed time
- **Agent Leaderboard** — Who's doing all the work (ranked by message count)
- **Cost History** — 14-day area chart of estimated costs
- **Model Distribution** — Donut chart showing which models get the most use
- **Activity Heatmap** — GitHub-style 7-day heatmap (hour x day-of-week)
- **Session Table** — Full session list with TanStack Table: sorting, search, agent filter, pagination, expandable rows
- **Date Filtering** — Today / Week / Month / All toggle
- **Auto-refresh** — Dashboard updates every 15 seconds
- **Dark Mode** — Because obviously

## How It Works

OhMyDashboard reads OpenCode's local JSON storage directly from:

```
~/.local/share/opencode/storage/
├── sessions/     # Session metadata
├── messages/     # Message content
├── parts/        # Message parts (tool calls, results)
└── projects/     # Project registry
```

No database, no API keys, no configuration. If OpenCode runs on your machine, the dashboard just works.

## Development

```bash
git clone <repo>
cd ohmydashboard
npm install
npm run dev
```

This starts two processes:
- **Vite** dev server on `:5174` (frontend with HMR)
- **Hono** API server on `:3456` (backend)

### Build

```bash
npm run build    # TypeScript check + Vite build
```

### Production (local)

```bash
bun bin/cli.ts   # Single server on :51234
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Tailwind CSS v4, Recharts, TanStack Table, Lucide Icons |
| Backend | Hono (serves API + static SPA) |
| Runtime | Bun (CLI + server) |
| Build | Vite 7, TypeScript 5.9 |

## Project Structure

```
ohmydashboard/
├── bin/cli.ts                  # CLI entry (bunx ohmydashboard)
├── server/
│   ├── index.ts                # Hono app + dev server
│   ├── opencode-reader.ts      # Reads OpenCode JSON storage
│   └── cache.ts                # TTL cache (30s)
├── src/
│   ├── App.tsx                 # Dashboard layout
│   ├── components/
│   │   ├── Logo.tsx            # SVG logo
│   │   └── dashboard/          # All dashboard panels
│   ├── hooks/
│   │   └── useDashboardData.ts # Data fetching + auto-refresh
│   └── types/opencode.ts       # TypeScript interfaces
├── public/favicon.svg
└── package.json
```

## Requirements

- **Bun** >= 1.1.0
- **OpenCode** installed and used (needs `~/.local/share/opencode/storage/` to exist)

## License

MIT
