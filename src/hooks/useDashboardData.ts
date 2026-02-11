import { useState, useEffect, useCallback, useRef } from 'react'
import type { DashboardStats, AgentActivity, Session, AgentUsage } from '@/types/opencode'

interface DashboardData {
  stats: DashboardStats | null
  agents: AgentActivity[]
  sessions: Session[]
  usage: AgentUsage[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
  refresh: () => void
  secondsUntilRefresh: number
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL / 1000)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [statsData, agentsData, sessionsData, usageData] = await Promise.all([
        fetchJSON<DashboardStats>('/api/stats'),
        fetchJSON<AgentActivity[]>('/api/agents/active'),
        fetchJSON<Session[]>('/api/sessions'),
        fetchJSON<AgentUsage[]>('/api/agents/usage'),
      ])
      setStats(statsData)
      setAgents(agentsData)
      setSessions(sessionsData)
      setUsage(usageData)
      setLastUpdated(Date.now())
      setSecondsUntilRefresh(REFRESH_INTERVAL / 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, REFRESH_INTERVAL)
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((s) => Math.max(0, s - 1))
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [fetchData])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  return { stats, agents, sessions, usage, loading, error, lastUpdated, refresh, secondsUntilRefresh }
}
