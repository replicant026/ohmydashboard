import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { ModelUsage } from '@/types/opencode'
import { formatCost } from '@/lib/utils'

interface ModelDistributionProps {
  data: ModelUsage[]
  loading: boolean
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ModelUsage }> }) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-300 font-medium">{entry.model}</p>
      <div className="flex gap-3 mt-1">
        <span className="text-zinc-400">{entry.messages} msgs</span>
        <span className="text-emerald-400 font-mono">{formatCost(entry.cost)}</span>
      </div>
      <p className="text-zinc-500 mt-0.5">{entry.percentage}% of total</p>
    </div>
  )
}

export function ModelDistribution({ data, loading }: ModelDistributionProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Model Distribution</h2>
        <div className="h-48 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const totalMessages = data.reduce((sum, d) => sum + d.messages, 0)
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Model Distribution</h2>
        <span className="text-xs text-zinc-500 font-mono">{totalMessages} msgs · {formatCost(totalCost)}</span>
      </div>

      <div className="flex items-start gap-4">
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="messages"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.model} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 pt-1">
          {data.map((entry) => (
            <div key={entry.model} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-400 truncate flex-1">{entry.model}</span>
              <span className="text-zinc-500 font-mono tabular-nums">{entry.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
