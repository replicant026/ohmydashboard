import type { AgentUsage } from '@/types/opencode'
import { getAgentChartColor } from '@/lib/utils'

interface Props {
  usage: AgentUsage[]
  loading: boolean
}

export function AgentLeaderboard({ usage, loading }: Props) {
  const sorted = [...usage].sort((a, b) => b.count - a.count)
  const maxCount = sorted.length > 0 ? sorted[0].count : 1

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Agent Leaderboard</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-600 animate-pulse">Loading…</div>
      ) : usage.length === 0 ? (
        <div className="p-8 text-center text-zinc-600">No usage data</div>
      ) : (
        <div className="p-5 space-y-3">
          {sorted.map((agent) => {
            const widthPct = Math.max((agent.count / maxCount) * 100, 4)
            const color = getAgentChartColor(agent.agent)
            return (
              <div key={agent.agent} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="font-mono text-zinc-300">{agent.agent}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span>{agent.totalMessages} msgs</span>
                    <span className="font-mono text-zinc-300">{agent.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${widthPct}%`, backgroundColor: color, opacity: 0.8 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
