import { RefreshCw, Calendar } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useDashboardData } from "@/hooks/useDashboardData";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ActiveAgents } from "@/components/dashboard/ActiveAgents";
import SessionTable from "@/components/dashboard/SessionTable";
import { AgentLeaderboard } from "@/components/dashboard/AgentLeaderboard";
import { CostChart } from "@/components/dashboard/CostChart";
import { ModelDistribution } from "@/components/dashboard/ModelDistribution";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import type { DateRange } from "@/types/opencode";
import { cn } from "@/lib/utils";

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "All", value: "all" },
];

function App() {
  const {
    stats,
    agents,
    sessions,
    usage,
    costHistory,
    models,
    activity,
    loading,
    error,
    lastUpdated,
    refresh,
    secondsUntilRefresh,
    dateRange,
    setDateRange,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <h1 className="text-lg font-semibold text-zinc-100">OhMyDashboard</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-mono">
              v0.6.1
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-0.5 border border-zinc-700/50">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 ml-2" />
              {DATE_RANGES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setDateRange(value)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    dateRange === value
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">{error}</span>
            )}
            {lastUpdated && (
              <span className="text-xs text-zinc-600 font-mono">{secondsUntilRefresh}s</span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Row 1: Summary Cards */}
        <SummaryCards stats={stats} loading={loading} />

        {/* Row 2: Active Agents + Agent Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ActiveAgents agents={agents} loading={loading} />
          </div>
          <div className="lg:col-span-2">
            <AgentLeaderboard usage={usage} loading={loading} />
          </div>
        </div>

        {/* Row 3: Cost Chart + Model Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <CostChart data={costHistory} loading={loading} />
          </div>
          <div className="lg:col-span-2">
            <ModelDistribution data={models} loading={loading} />
          </div>
        </div>

        {/* Row 4: Activity Heatmap */}
        <ActivityHeatmap data={activity} loading={loading} />

        {/* Row 5: Sessions Table */}
        <SessionTable sessions={sessions} loading={loading} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-zinc-600">
          <span>OhMyDashboard — Agent monitoring for OpenCode</span>
          <span className="font-mono">opencode v1.1.53 · oh-my-opencode v3.5.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
