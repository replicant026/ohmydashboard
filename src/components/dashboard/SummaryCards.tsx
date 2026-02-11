import { Activity, MessagesSquare, DollarSign, Users } from 'lucide-react'
import type { DashboardStats } from '@/types/opencode'
import { formatCost } from '@/lib/utils'

interface Props {
  stats: DashboardStats | null
  loading: boolean
}

const cards = [
  { key: 'totalSessions' as const, label: 'Total Sessions', icon: Activity, accent: 'text-blue-400' },
  { key: 'totalMessages' as const, label: 'Total Messages', icon: MessagesSquare, accent: 'text-emerald-400' },
  { key: 'totalCost' as const, label: 'Total Cost', icon: DollarSign, accent: 'text-amber-400', format: formatCost },
  { key: 'activeAgents' as const, label: 'Active Agents', icon: Users, accent: 'text-purple-400' },
]

export function SummaryCards({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
