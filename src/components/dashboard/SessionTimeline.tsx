import type { Session } from '@/types/opencode'
import { cn, formatCost, formatTimeAgo, getAgentColor, truncateId } from '@/lib/utils'

interface Props {
  sessions: Session[]
  loading: boolean
}

export function SessionTimeline({ sessions, loading }: Props) {
  const sorted = [...sessions].sort((a, b) => b.time.updated - a.time.updated)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Recent Sessions</h2>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-600 animate-pulse">Loading…</div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center text-zinc-600">No sessions</div>
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {sorted.map((session) => (
            <div key={session.id} className="px-5 py-4 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">{truncateId(session.id, 12)}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{formatTimeAgo(session.time.updated)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1 font-mono truncate" title={session.directory}>
                    {session.directory.replace('/Users/macbook/Documents/Work/', '~/')}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {session.agents.map((agent) => (
                      <span
                        key={agent}
                        className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border', getAgentColor(agent))}
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono text-zinc-300">{session.messageCount} <span className="text-zinc-500">msgs</span></p>
                  <p className="text-sm font-mono text-amber-400 mt-1">{formatCost(session.cost)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
