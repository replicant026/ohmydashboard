import type { HourlyActivity } from '@/types/opencode'

interface ActivityHeatmapProps {
  data: HourlyActivity[]
  loading: boolean
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = ['12a', '', '', '3a', '', '', '6a', '', '', '9a', '', '', '12p', '', '', '3p', '', '', '6p', '', '', '9p', '', '']

function getIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-zinc-800/50'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-emerald-900/60'
  if (ratio < 0.5) return 'bg-emerald-700/60'
  if (ratio < 0.75) return 'bg-emerald-500/70'
  return 'bg-emerald-400/80'
}

export function ActivityHeatmap({ data, loading }: ActivityHeatmapProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-full flex flex-col">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Activity Heatmap</h2>
        <div className="h-48 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count), 1)
  const totalMessages = data.reduce((sum, d) => sum + d.count, 0)

  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const entry of data) {
    grid[entry.day][entry.hour] = entry.count
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Activity Heatmap</h2>
        <span className="text-xs text-zinc-500 font-mono">7-day · {totalMessages.toLocaleString()} msgs</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex gap-0.5 ml-10 mb-1">
            {HOUR_LABELS.map((label, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-zinc-600 font-mono">
                {label}
              </div>
            ))}
          </div>

          {DAY_LABELS.map((dayLabel, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
              <span className="w-9 text-right text-[10px] text-zinc-600 font-mono pr-1">{dayLabel}</span>
              {grid[dayIdx].map((count, hourIdx) => (
                <div
                  key={hourIdx}
                  className={`flex-1 h-4 rounded-[3px] ${getIntensity(count, max)} transition-colors hover:ring-1 hover:ring-zinc-500`}
                  title={`${dayLabel} ${hourIdx}:00 — ${count} messages`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[9px] text-zinc-600 mr-1">Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-zinc-800/50" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-900/60" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-700/60" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/70" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-400/80" />
        <span className="text-[9px] text-zinc-600 ml-1">More</span>
      </div>
    </div>
  )
}
