import { Activity, MessagesSquare, DollarSign, Users, Coins } from 'lucide-react'
import type { DashboardStats } from '@/types/opencode'
import { formatCost } from '@/lib/utils'

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

interface Props {
  stats: DashboardStats | null
  loading: boolean
}

const cards = [
  { key: 'totalSessions' as const, label: 'Total Sessions', icon: Activity, accent: 'text-blue-400' },
  { key: 'totalMessages' as const, label: 'Total Messages', icon: MessagesSquare, accent: 'text-emerald-400' },
  { key: 'totalTokens' as const, label: 'Total Tokens', icon: Coins, accent: 'text-cyan-400', format: formatTokens },
  { key: 'totalCost' as const, label: 'Total Cost', icon: DollarSign, accent: 'text-amber-400', format: formatCost },
  { key: 'activeAgents' as const, label: 'Active Agents', icon: Users, accent: 'text-purple-400' },
]

export function SummaryCards({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(({ key, label, icon: Icon, accent, format }) => (
        <div
          key={key}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4"
        >
          <div className={`p-2.5 rounded-lg bg-zinc-800 ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 font-mono ${loading ? 'text-zinc-600 animate-pulse' : 'text-zinc-100'}`}>
              {loading || !stats
                ? '—'
                : format
                  ? format(stats[key])
                  : stats[key].toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
