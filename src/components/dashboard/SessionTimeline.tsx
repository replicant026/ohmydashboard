import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, User, Bot } from 'lucide-react'
import type { Session, SessionMessage } from '@/types/opencode'
import { cn, formatCost, formatTimeAgo, getAgentColor, truncateId } from '@/lib/utils'

interface Props {
  sessions: Session[]
  loading: boolean
}

export function SessionTimeline({ sessions, loading }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const sorted = [...sessions].sort((a, b) => b.time.updated - a.time.updated)

  const toggleExpand = useCallback(async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null)
      setMessages([])
      return
    }
    setExpandedId(sessionId)
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`)
      if (res.ok) {
        const data: SessionMessage[] = await res.json()
        setMessages(data)
      }
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [expandedId])

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
          {sorted.map((session) => {
            const isExpanded = expandedId === session.id
            return (
              <div key={session.id}>
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full px-5 py-4 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="mt-0.5 text-zinc-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
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
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono text-zinc-300">{session.messageCount} <span className="text-zinc-500">msgs</span></p>
                      <p className="text-sm font-mono text-amber-400 mt-1">{formatCost(session.cost)}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800/50 bg-zinc-950/50 px-5 py-3">
                    {loadingMessages ? (
                      <div className="py-4 text-center text-xs text-zinc-600 animate-pulse">Loading messages…</div>
                    ) : messages.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-600">No messages</div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {messages.map((msg) => (
                          <div key={msg.id} className={cn(
                            'flex gap-2 p-2 rounded-lg text-xs',
                            msg.role === 'user' ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-zinc-800/50 border border-zinc-700/30'
                          )}>
                            <div className="shrink-0 mt-0.5">
                              {msg.role === 'user' ? (
                                <User className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  'font-medium',
                                  msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'
                                )}>
                                  {msg.role === 'user' ? 'You' : msg.agent ?? 'assistant'}
                                </span>
                                {msg.model && (
                                  <span className="text-zinc-600 font-mono text-[10px]">{msg.model}</span>
                                )}
                                {msg.cost != null && msg.cost > 0 && (
                                  <span className="text-amber-500/70 font-mono text-[10px]">{formatCost(msg.cost)}</span>
                                )}
                                <span className="text-zinc-700 font-mono text-[10px] ml-auto">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
