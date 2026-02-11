export interface Session {
  id: string
  title: string
  directory: string
  projectId: string
  messageCount: number
  cost: number
  agents: string[]
  time: {
    created: number
    updated: number
  }
}

export interface AgentActivity {
  agent: string
  directory: string
  status: 'running' | 'idle' | 'completed'
  sessionId: string
  elapsedMs: number
  model: string
  messageCount: number
}

export interface DashboardStats {
  totalSessions: number
  totalMessages: number
  totalCost: number
  activeAgents: number
}

export interface AgentUsage {
  agent: string
  count: number
  percentage: number
  totalMessages: number
}

// ── Phase 2 types ───────────────────────────────────────────

export interface CostHistoryEntry {
  date: string         // ISO date "2026-02-10"
  label: string        // Display label "Feb 10"
  cost: number
  sessions: number
  messages: number
}

export interface ModelUsage {
  model: string
  messages: number
  cost: number
  percentage: number
  color: string
}

export interface HourlyActivity {
  day: number          // 0=Sun, 1=Mon, ...6=Sat
  hour: number         // 0-23
  count: number        // message count
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  agent?: string
  model?: string
  cost?: number
}

export type DateRange = 'today' | 'week' | 'month' | 'all'
