import { RefreshCw } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { ActiveAgents } from '@/components/dashboard/ActiveAgents'
import { SessionTimeline } from '@/components/dashboard/SessionTimeline'
import { AgentLeaderboard } from '@/components/dashboard/AgentLeaderboard'

function App() {
  const { stats, agents, sessions, usage, loading, error, lastUpdated, refresh, secondsUntilRefresh } = useDashboardData()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              ⚡
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">OhMyDashboard</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-mono">v0.1.0</span>
          </div>

          <div className="flex items-center gap-4">
            {error && (
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                {error}
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-zinc-600 font-mono">
                refresh in {secondsUntilRefresh}s
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards stats={stats} loading={loading} />

        {/* Active Agents + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ActiveAgents agents={agents} loading={loading} />
          </div>
          <div className="lg:col-span-2">
            <AgentLeaderboard usage={usage} loading={loading} />
          </div>
        </div>

        {/* Session Timeline */}
        <SessionTimeline sessions={sessions} loading={loading} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-zinc-600">
          <span>OhMyDashboard — Agent monitoring for OpenCode</span>
          <span className="font-mono">opencode v1.1.53 · oh-my-opencode v3.5.0</span>
        </div>
      </footer>
    </div>
  )
}

export default App
