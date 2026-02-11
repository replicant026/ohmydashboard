import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { CostHistoryEntry } from '@/types/opencode'
import { formatCost } from '@/lib/utils'

interface CostChartProps {
  data: CostHistoryEntry[]
  loading: boolean
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CostHistoryEntry }> }) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-300 font-medium">{entry.label}</p>
      <p className="text-emerald-400 font-mono mt-1">{formatCost(entry.cost)}</p>
      <div className="flex gap-3 mt-1 text-zinc-500">
        <span>{entry.sessions} sessions</span>
        <span>{entry.messages} msgs</span>
      </div>
    </div>
  )
}

export function CostChart({ data, loading }: CostChartProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Cost History</h2>
        <div className="h-48 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const totalCost = data.reduce((sum, d) => sum + d.cost, 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Cost History</h2>
        <span className="text-xs text-zinc-500 font-mono">14-day total: <span className="text-emerald-400">{formatCost(totalCost)}</span></span>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#18181b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
