import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  DashboardStats,
  AgentActivity,
  Session,
  AgentUsage,
  CostHistoryEntry,
  ModelUsage,
  HourlyActivity,
  SessionMessage,
  DateRange,
} from '../src/types/opencode'

const app = new Hono()
app.use('/*', cors())

const now = Date.now()
const HOUR = 3_600_000
const DAY = 86_400_000

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString().split('T')[0]
}

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const mockSessions: Session[] = [
  {
    id: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    title: 'OhMyDashboard brainstorm',
    directory: '/Users/macbook/Documents/Work/SysArch',
    projectId: 'proj_sysarch',
    messageCount: 47,
    cost: 3.82,
    agents: ['sisyphus', 'explore', 'librarian', 'prometheus'],
    time: { created: now - 2 * HOUR, updated: now - 5 * 60_000 },
  },
  {
    id: 'ses_3b749dab1ffeKL9mXp2wR7qNbZ',
    title: 'Odoo module development',
    directory: '/Users/macbook/Documents/Work/SysArch',
    projectId: 'proj_sysarch',
    messageCount: 432,
    cost: 12.47,
    agents: ['sisyphus', 'oracle', 'explore', 'metis'],
    time: { created: now - DAY - 6 * HOUR, updated: now - DAY },
  },
  {
    id: 'ses_3be5ca7f2ffeJP8nYw4xS5tMaQ',
    title: 'Focus app refactoring',
    directory: '/Users/macbook/Documents/Work/focus',
    projectId: 'proj_focus',
    messageCount: 265,
    cost: 8.91,
    agents: ['sisyphus', 'oracle', 'librarian'],
    time: { created: now - 2 * DAY, updated: now - 1.5 * DAY },
  },
  {
    id: 'ses_4a1b2c3d4ffeAB5cDE6fGH7iJK',
    title: 'Content strategy planning',
    directory: '/Users/macbook/Documents/Work/SysArch',
    projectId: 'proj_sysarch',
    messageCount: 89,
    cost: 2.15,
    agents: ['sisyphus', 'momus'],
    time: { created: now - 3 * DAY, updated: now - 2.8 * DAY },
  },
  {
    id: 'ses_5x6y7z8w9ffeQR0sST1uUV2wXY',
    title: 'WordPress theme build',
    directory: '/Users/macbook/Documents/Work/justworkonit',
    projectId: 'proj_justworkonit',
    messageCount: 156,
    cost: 5.33,
    agents: ['sisyphus', 'explore', 'librarian', 'atlas'],
    time: { created: now - 4 * DAY, updated: now - 3.5 * DAY },
  },
  {
    id: 'ses_6m7n8o9p0ffeWX1yYZ2aAB3cDE',
    title: 'Debugging auth flow',
    directory: '/Users/macbook/Documents/Work/focus',
    projectId: 'proj_focus',
    messageCount: 78,
    cost: 4.67,
    agents: ['sisyphus', 'oracle', 'explore'],
    time: { created: now - 5 * DAY, updated: now - 4.5 * DAY },
  },
  {
    id: 'ses_7a8b9c0d1ffeEF2gGH3iIJ4kKL',
    title: 'API integration tests',
    directory: '/Users/macbook/Documents/Work/SysArch',
    projectId: 'proj_sysarch',
    messageCount: 198,
    cost: 6.42,
    agents: ['sisyphus', 'oracle', 'explore', 'librarian'],
    time: { created: now - 6 * DAY, updated: now - 5.8 * DAY },
  },
  {
    id: 'ses_8e9f0a1b2ffeLM3nNO4pPQ5rRS',
    title: 'Database schema design',
    directory: '/Users/macbook/Documents/Work/SysArch',
    projectId: 'proj_sysarch',
    messageCount: 312,
    cost: 9.88,
    agents: ['sisyphus', 'oracle', 'metis', 'momus'],
    time: { created: now - 7 * DAY, updated: now - 6.5 * DAY },
  },
]

const mockActiveAgents: AgentActivity[] = [
  {
    agent: 'sisyphus',
    directory: '/Users/macbook/Documents/Work/SysArch',
    status: 'running',
    sessionId: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    elapsedMs: 12 * 60_000 + 34_000,
    model: 'claude-sonnet-4.5',
    messageCount: 47,
  },
  {
    agent: 'explore',
    directory: '/Users/macbook/Documents/Work/SysArch',
    status: 'running',
    sessionId: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    elapsedMs: 8 * 60_000 + 12_000,
    model: 'gpt-5-mini',
    messageCount: 15,
  },
  {
    agent: 'librarian',
    directory: '/Users/macbook/Documents/Work/SysArch',
    status: 'running',
    sessionId: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    elapsedMs: 8 * 60_000 + 5_000,
    model: 'claude-sonnet-4.5',
    messageCount: 12,
  },
  {
    agent: 'oracle',
    directory: '/Users/macbook/Documents/Work/SysArch',
    status: 'idle',
    sessionId: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    elapsedMs: 0,
    model: 'gpt-5.2',
    messageCount: 0,
  },
  {
    agent: 'prometheus',
    directory: '/Users/macbook/Documents/Work/SysArch',
    status: 'completed',
    sessionId: 'ses_3b4f698e4ffen2QFyY5HmP4pHQ',
    elapsedMs: 3 * 60_000 + 45_000,
    model: 'claude-opus-4.5',
    messageCount: 8,
  },
]

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4.5': '#3b82f6',
  'claude-opus-4.5': '#8b5cf6',
  'gpt-5.2': '#10b981',
  'gpt-5-mini': '#6ee7b7',
  'gemini-3-pro': '#f59e0b',
  'gemini-3-flash': '#fbbf24',
  'claude-haiku-4.5': '#93c5fd',
}

function filterByRange(sessions: Session[], range: DateRange): Session[] {
  const cutoff: Record<DateRange, number> = {
    today: now - DAY,
    week: now - 7 * DAY,
    month: now - 30 * DAY,
    all: 0,
  }
  return sessions.filter((s) => s.time.created >= cutoff[range])
}

function computeUsage(range: DateRange): AgentUsage[] {
  const filtered = filterByRange(mockSessions, range)
  const counts: Record<string, { count: number; messages: number }> = {}
  for (const session of filtered) {
    for (const agent of session.agents) {
      if (!counts[agent]) counts[agent] = { count: 0, messages: 0 }
      counts[agent].count++
      counts[agent].messages += Math.floor(session.messageCount / session.agents.length)
    }
  }
  const total = Object.values(counts).reduce((sum, v) => sum + v.count, 0) || 1
  return Object.entries(counts)
    .map(([agent, { count, messages }]) => ({
      agent,
      count,
      percentage: Math.round((count / total) * 100),
      totalMessages: messages,
    }))
    .sort((a, b) => b.count - a.count)
}

function computeStats(range: DateRange): DashboardStats {
  const filtered = filterByRange(mockSessions, range)
  return {
    totalSessions: filtered.length,
    totalMessages: filtered.reduce((sum, s) => sum + s.messageCount, 0),
    totalCost: parseFloat(filtered.reduce((sum, s) => sum + s.cost, 0).toFixed(2)),
    activeAgents: mockActiveAgents.filter((a) => a.status === 'running').length,
  }
}

function computeCostHistory(): CostHistoryEntry[] {
  const entries: CostHistoryEntry[] = []
  for (let i = 13; i >= 0; i--) {
    const dayTs = now - i * DAY
    const daySessions = mockSessions.filter((s) => {
      const sessionDate = isoDate(s.time.created)
      return sessionDate === isoDate(dayTs)
    })
    entries.push({
      date: isoDate(dayTs),
      label: shortDate(dayTs),
      cost: daySessions.reduce((sum, s) => sum + s.cost, 0),
      sessions: daySessions.length,
      messages: daySessions.reduce((sum, s) => sum + s.messageCount, 0),
    })
  }
  const daysWithData = entries.filter((e) => e.cost === 0)
  for (const entry of daysWithData) {
    entry.cost = parseFloat((Math.random() * 8 + 1).toFixed(2))
    entry.sessions = randomBetween(1, 4)
    entry.messages = randomBetween(40, 350)
  }
  return entries
}

function computeModelUsage(): ModelUsage[] {
  const models: Record<string, { messages: number; cost: number }> = {
    'claude-sonnet-4.5': { messages: 485, cost: 14.22 },
    'claude-opus-4.5': { messages: 89, cost: 11.45 },
    'gpt-5.2': { messages: 222, cost: 6.18 },
    'gpt-5-mini': { messages: 184, cost: 1.82 },
    'gemini-3-pro': { messages: 67, cost: 2.35 },
    'gemini-3-flash': { messages: 120, cost: 1.33 },
  }
  const totalMsgs = Object.values(models).reduce((sum, v) => sum + v.messages, 0)
  return Object.entries(models)
    .map(([model, { messages, cost }]) => ({
      model,
      messages,
      cost: parseFloat(cost.toFixed(2)),
      percentage: Math.round((messages / totalMsgs) * 100),
      color: MODEL_COLORS[model] ?? '#71717a',
    }))
    .sort((a, b) => b.messages - a.messages)
}

function computeHourlyActivity(): HourlyActivity[] {
  const activity: HourlyActivity[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let count = 0
      if (hour >= 9 && hour <= 23) {
        count = randomBetween(0, hour >= 10 && hour <= 17 ? 25 : 10)
      } else if (hour >= 0 && hour <= 2) {
        count = randomBetween(0, 5)
      }
      activity.push({ day, hour, count })
    }
  }
  return activity
}

function generateSessionMessages(sessionId: string): SessionMessage[] {
  const session = mockSessions.find((s) => s.id === sessionId)
  if (!session) return []

  const messages: SessionMessage[] = []
  const msgCount = Math.min(session.messageCount, 20)
  const agents = session.agents
  const models = ['claude-sonnet-4.5', 'gpt-5.2', 'gpt-5-mini']

  for (let i = 0; i < msgCount; i++) {
    const isUser = i % 3 === 0
    const agent = agents[i % agents.length]
    messages.push({
      id: `msg_${sessionId.slice(4, 10)}_${i}`,
      role: isUser ? 'user' : 'assistant',
      content: isUser
        ? SAMPLE_USER_MESSAGES[i % SAMPLE_USER_MESSAGES.length]
        : SAMPLE_ASSISTANT_MESSAGES[i % SAMPLE_ASSISTANT_MESSAGES.length],
      timestamp: session.time.created + i * 45_000,
      agent: isUser ? undefined : agent,
      model: isUser ? undefined : models[i % models.length],
      cost: isUser ? undefined : parseFloat((Math.random() * 0.15 + 0.01).toFixed(3)),
    })
  }
  return messages
}

const SAMPLE_USER_MESSAGES = [
  'Can you help me refactor this component?',
  'What\'s the best approach for this?',
  'Find all usages of this function.',
  'Create a new module for handling auth.',
  'Why is this test failing?',
  'Optimize this query for performance.',
  'Add error handling to the API endpoint.',
]

const SAMPLE_ASSISTANT_MESSAGES = [
  'I\'ll analyze the component structure and identify refactoring opportunities. Let me search for related patterns in the codebase first.',
  'Based on my analysis, I recommend using the Strategy pattern here. This aligns with the existing architecture and provides better extensibility.',
  'Found 12 references across 8 files. The primary usage is in the service layer, with 3 test files also referencing it.',
  'I\'ve created the auth module with JWT token handling, middleware, and role-based access control. All types are properly defined.',
  'The test failure is caused by a race condition in the async setup. The mock timer isn\'t advancing before the assertion runs.',
  'I\'ve optimized the query by adding a composite index and restructuring the JOIN order. Estimated 3x improvement in execution time.',
  'Added comprehensive error handling with proper HTTP status codes, error messages, and logging. Includes validation for all input parameters.',
]

app.get('/api/stats', (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  return c.json(computeStats(range))
})

app.get('/api/agents/active', (c) => {
  const agents = mockActiveAgents.map((a) => ({
    ...a,
    elapsedMs: a.status === 'running' ? a.elapsedMs + randomBetween(1000, 5000) : a.elapsedMs,
  }))
  return c.json(agents)
})

app.get('/api/sessions', (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  return c.json(filterByRange(mockSessions, range))
})

app.get('/api/sessions/:id/messages', (c) => {
  const id = c.req.param('id')
  return c.json(generateSessionMessages(id))
})

app.get('/api/agents/usage', (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  return c.json(computeUsage(range))
})

app.get('/api/cost-history', (c) => {
  return c.json(computeCostHistory())
})

app.get('/api/models', (c) => {
  return c.json(computeModelUsage())
})

app.get('/api/activity', (c) => {
  return c.json(computeHourlyActivity())
})

const port = 3456
console.log(`🚀 OhMyDashboard API running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
