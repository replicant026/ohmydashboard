import { useState, useEffect, useCallback, useRef } from 'react'
import type { DashboardStats, AgentActivity, Session, AgentUsage, CostHistoryEntry, ModelUsage, HourlyActivity, DateRange } from '@/types/opencode'

interface DashboardData {
  stats: DashboardStats | null
  agents: AgentActivity[]
  sessions: Session[]
  usage: AgentUsage[]
  costHistory: CostHistoryEntry[]
  models: ModelUsage[]
  activity: HourlyActivity[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
  refresh: () => void
  secondsUntilRefresh: number
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}

const REFRESH_INTERVAL = 15_000

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [agents, setAgents] = useState<AgentActivity[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [usage, setUsage] = useState<AgentUsage[]>([])
  const [costHistory, setCostHistory] = useState<CostHistoryEntry[]>([])
  const [models, setModels] = useState<ModelUsage[]>([])
  const [activity, setActivity] = useState<HourlyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL / 1000)
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null)

  const fetchData = useCallback(async (range: DateRange) => {
    try {
      setError(null)
      const rangeParam = `?range=${range}`
      const [statsData, agentsData, sessionsData, usageData, costData, modelsData, activityData] = await Promise.all([
        fetchJSON<DashboardStats>(`/api/stats${rangeParam}`),
        fetchJSON<AgentActivity[]>('/api/agents/active'),
        fetchJSON<Session[]>(`/api/sessions${rangeParam}`),
        fetchJSON<AgentUsage[]>(`/api/agents/usage${rangeParam}`),
        fetchJSON<CostHistoryEntry[]>('/api/cost-history'),
        fetchJSON<ModelUsage[]>('/api/models'),
        fetchJSON<HourlyActivity[]>('/api/activity'),
      ])
      setStats(statsData)
      setAgents(agentsData)
      setSessions(sessionsData)
      setUsage(usageData)
      setCostHistory(costData)
      setModels(modelsData)
      setActivity(activityData)
      setLastUpdated(Date.now())
      setSecondsUntilRefresh(REFRESH_INTERVAL / 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(dateRange)
    timerRef.current = setInterval(() => fetchData(dateRange), REFRESH_INTERVAL)
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((s) => Math.max(0, s - 1))
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [fetchData, dateRange])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchData(dateRange)
  }, [fetchData, dateRange])

  return { stats, agents, sessions, usage, costHistory, models, activity, loading, error, lastUpdated, refresh, secondsUntilRefresh, dateRange, setDateRange }
}
