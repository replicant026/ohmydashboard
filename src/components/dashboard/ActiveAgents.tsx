import type { AgentActivity } from '@/types/opencode'
import { cn, formatElapsed, getAgentColor } from '@/lib/utils'

interface Props {
  agents: AgentActivity[]
  loading: boolean
}

const STATUS_DOT: Record<AgentActivity['status'], string> = {
  running: 'bg-emerald-400 shadow-emerald-400/50 shadow-[0_0_6px]',
  idle: 'bg-amber-400',
  completed: 'bg-zinc-500',
}

export function ActiveAgents({ agents, loading }: Props) {
  const sorted = [...agents].sort((a, b) => {
    const order: Record<string, number> = { running: 0, idle: 1, completed: 2 }
    const statusDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3)
    if (statusDiff !== 0) return statusDiff
    return b.elapsedMs - a.elapsedMs
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Active Agents</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-600 animate-pulse">Loading…</div>
      ) : agents.length === 0 ? (
        <div className="p-8 text-center text-zinc-600">No active agents</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800/50">
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Agent</th>
                <th className="text-left px-5 py-3 font-medium">Directory</th>
                <th className="text-left px-5 py-3 font-medium">Model</th>
                <th className="text-right px-5 py-3 font-medium">Msgs</th>
                <th className="text-right px-5 py-3 font-medium">Elapsed</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((agent, i) => (
                <tr
                  key={`${agent.sessionId}-${agent.agent}-${i}`}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[agent.status])} />
                      <span className="text-zinc-400 capitalize text-xs">{agent.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', getAgentColor(agent.agent))}>
                      {agent.agent}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-400 max-w-[200px] truncate" title={agent.directory}>
                    {agent.directory.replace('/Users/macbook/Documents/Work/', '~/')}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-zinc-500">{agent.model}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-300">{agent.messageCount}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-400">{formatElapsed(agent.elapsedMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
