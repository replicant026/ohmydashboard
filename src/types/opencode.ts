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
