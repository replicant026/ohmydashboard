export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function truncateId(id: string, length = 10): string {
  if (id.length <= length) return id
  return id.slice(0, length) + '…'
}

const AGENT_COLORS: Record<string, string> = {
  sisyphus: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  oracle: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  librarian: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  explore: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  prometheus: 'bg-red-500/20 text-red-400 border-red-500/30',
  metis: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  momus: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  atlas: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'multimodal-looker': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

const AGENT_DOT_COLORS: Record<string, string> = {
  sisyphus: '#3b82f6',
  oracle: '#a855f7',
  librarian: '#f59e0b',
  explore: '#10b981',
  prometheus: '#ef4444',
  metis: '#06b6d4',
  momus: '#f97316',
  atlas: '#6366f1',
  'multimodal-looker': '#ec4899',
}

export function getAgentChartColor(agent: string): string {
  return AGENT_DOT_COLORS[agent] ?? '#71717a'
}
