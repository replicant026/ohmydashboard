import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { TTLCache } from './cache'

// --- Raw types (what OpenCode stores on disk) ---

interface RawSession {
  id: string
  slug: string
  version: string
  projectID: string
  directory: string
  parentID?: string
  title: string
  time: { created: number; updated: number }
}

interface RawMessage {
  id: string
  sessionID: string
  role: string
  time: { created: number; completed?: number }
  parentID?: string
  modelID?: string
  providerID?: string
  mode?: string
  agent?: string
  cost?: number
  tokens?: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
  finish?: string
}

interface RawPart {
  id: string
  sessionID: string
  messageID: string
  type: string
  text?: string
  cost?: number
  tokens?: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}

interface RawProject {
  id: string
  worktree: string
  vcs: string
  time: { created: number; updated: number }
}

// --- Dashboard types (what the API returns) ---

export interface Session {
  id: string
  title: string
  directory: string
  projectId: string
  messageCount: number
  cost: number
  agents: string[]
  time: { created: number; updated: number }
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

export interface CostHistoryEntry {
  date: string
  label: string
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
  day: number
  hour: number
  count: number
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  agent?: string
  model?: string
  cost?: number
  tokens?: { input: number; output: number; reasoning: number }
}

// --- Constants ---

const STORAGE_BASE = path.join(os.homedir(), '.local/share/opencode/storage')

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4.5': '#3b82f6',
  'claude-opus-4.5': '#8b5cf6',
  'claude-opus-4-5-thinking': '#7c3aed',
  'claude-sonnet-4-5': '#3b82f6',
  'gpt-5.2': '#10b981',
  'gpt-5-mini': '#6ee7b7',
  'gemini-3-pro': '#f59e0b',
  'gemini-3-flash': '#fbbf24',
  'gemini-3-flash-preview': '#f59e0b',
  'claude-haiku-4.5': '#93c5fd',
}

const FALLBACK_COLORS = [
  '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#14b8a6',
  '#84cc16', '#f97316', '#06b6d4', '#d946ef', '#0ea5e9',
]

function getModelColor(model: string, index: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

// --- File system helpers ---

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function readJsonDir<T>(dirPath: string): Promise<T[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const jsonFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'))
    const results = await Promise.all(
      jsonFiles.map(e => readJsonFile<T>(path.join(dirPath, e.name)))
    )
    return results.filter((r): r is T => r !== null)
  } catch {
    return []
  }
}

async function readNestedJsonDir<T>(dirPath: string): Promise<T[]> {
  try {
    const subdirs = await fs.readdir(dirPath, { withFileTypes: true })
    const dirs = subdirs.filter(e => e.isDirectory())
    const allResults = await Promise.all(
      dirs.map(d => readJsonDir<T>(path.join(dirPath, d.name)))
    )
    return allResults.flat()
  } catch {
    return []
  }
}

// --- Date range helpers ---

type DateRange = 'today' | 'week' | 'month' | 'all'

function getCutoff(range: DateRange): number {
  const now = Date.now()
  switch (range) {
    case 'today': return now - 24 * 60 * 60 * 1000
    case 'week': return now - 7 * 24 * 60 * 60 * 1000
    case 'month': return now - 30 * 24 * 60 * 60 * 1000
    case 'all': return 0
  }
}

// --- OpenCode Reader ---

export class OpenCodeReader {
  private cache = new TTLCache<unknown>(30_000)

  private async cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key) as T | null
    if (cached) return cached
    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }

  // --- Raw data readers ---

  async getAllProjects(): Promise<RawProject[]> {
    return this.cachedFetch('projects', () =>
      readJsonDir<RawProject>(path.join(STORAGE_BASE, 'project'))
    )
  }

  async getAllSessions(): Promise<RawSession[]> {
    return this.cachedFetch('sessions', () =>
      readNestedJsonDir<RawSession>(path.join(STORAGE_BASE, 'session'))
    )
  }

  async getAllMessages(): Promise<RawMessage[]> {
    return this.cachedFetch('messages', () =>
      readNestedJsonDir<RawMessage>(path.join(STORAGE_BASE, 'message'))
    )
  }

  async getSessionMessages(sessionId: string): Promise<RawMessage[]> {
    return this.cachedFetch(`messages:${sessionId}`, () =>
      readJsonDir<RawMessage>(path.join(STORAGE_BASE, 'message', sessionId))
    )
  }

  async getMessageParts(messageId: string): Promise<RawPart[]> {
    return readJsonDir<RawPart>(path.join(STORAGE_BASE, 'part', messageId))
  }

  // --- Transform to dashboard types ---

  async getSessions(range: DateRange = 'all'): Promise<Session[]> {
    const [rawSessions, allMessages] = await Promise.all([
      this.getAllSessions(),
      this.getAllMessages(),
    ])

    const cutoff = getCutoff(range)

    // Group messages by sessionID
    const msgBySession = new Map<string, RawMessage[]>()
    for (const msg of allMessages) {
      const list = msgBySession.get(msg.sessionID) ?? []
      list.push(msg)
      msgBySession.set(msg.sessionID, list)
    }

    return rawSessions
      .filter(s => s.time.created >= cutoff)
      .map(raw => {
        const msgs = msgBySession.get(raw.id) ?? []
        const agents = [...new Set(
          msgs.map(m => m.agent).filter((a): a is string => !!a)
        )]
        const cost = msgs.reduce((sum, m) => sum + (m.cost ?? 0), 0)

        return {
          id: raw.id,
          title: raw.title || raw.slug || 'Untitled',
          directory: raw.directory,
          projectId: raw.projectID,
          messageCount: msgs.length,
          cost,
          agents,
          time: raw.time,
        }
      })
      .sort((a, b) => b.time.created - a.time.created)
  }

  async getStats(range: DateRange = 'all'): Promise<DashboardStats> {
    const sessions = await this.getSessions(range)
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
    const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0)

    // "Active" = sessions updated within the last 5 minutes
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const activeAgents = sessions.filter(s => s.time.updated >= fiveMinAgo).length

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalCost,
      activeAgents,
    }
  }

  async getActiveAgents(): Promise<AgentActivity[]> {
    // Detect "active" by finding sessions updated in last 5 minutes
    const rawSessions = await this.getAllSessions()
    const allMessages = await this.getAllMessages()
    const fiveMinAgo = Date.now() - 5 * 60 * 1000

    const recentSessions = rawSessions.filter(s => s.time.updated >= fiveMinAgo)

    return recentSessions.map(s => {
      const msgs = allMessages.filter(m => m.sessionID === s.id)
      const lastMsg = msgs.sort((a, b) => b.time.created - a.time.created)[0]
      const agents = msgs.map(m => m.agent).filter((a): a is string => !!a)
      const primaryAgent = agents[agents.length - 1] ?? 'unknown'

      return {
        agent: primaryAgent,
        directory: s.directory,
        status: 'running' as const,
        sessionId: s.id,
        elapsedMs: Date.now() - s.time.created,
        model: lastMsg?.modelID ?? 'unknown',
        messageCount: msgs.length,
      }
    })
  }

  async getAgentUsage(range: DateRange = 'all'): Promise<AgentUsage[]> {
    const allMessages = await this.getAllMessages()
    const cutoff = getCutoff(range)

    const filtered = allMessages.filter(m => m.time.created >= cutoff && m.agent)

    // Count messages per agent
    const agentMsgs = new Map<string, number>()
    const agentSessions = new Map<string, Set<string>>()

    for (const msg of filtered) {
      const agent = msg.agent!
      agentMsgs.set(agent, (agentMsgs.get(agent) ?? 0) + 1)
      if (!agentSessions.has(agent)) agentSessions.set(agent, new Set())
      agentSessions.get(agent)!.add(msg.sessionID)
    }

    const totalMsgs = filtered.length

    return [...agentMsgs.entries()]
      .map(([agent, totalMessages]) => ({
        agent,
        count: agentSessions.get(agent)?.size ?? 0,
        percentage: totalMsgs > 0 ? Math.round((totalMessages / totalMsgs) * 100) : 0,
        totalMessages,
      }))
      .sort((a, b) => b.totalMessages - a.totalMessages)
  }

  async getCostHistory(): Promise<CostHistoryEntry[]> {
    const allMessages = await this.getAllMessages()
    const rawSessions = await this.getAllSessions()

    // Group by date (last 14 days)
    const now = new Date()
    const days: CostHistoryEntry[] = []

    // Build session lookup by ID
    const sessionById = new Map<string, RawSession>()
    for (const s of rawSessions) sessionById.set(s.id, s)

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000

      const dayMsgs = allMessages.filter(m => m.time.created >= dayStart && m.time.created < dayEnd)
      const daySessions = new Set(dayMsgs.map(m => m.sessionID))
      const cost = dayMsgs.reduce((sum, m) => sum + (m.cost ?? 0), 0)

      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost,
        sessions: daySessions.size,
        messages: dayMsgs.length,
      })
    }

    return days
  }

  async getModelUsage(): Promise<ModelUsage[]> {
    const allMessages = await this.getAllMessages()
    const assistantMsgs = allMessages.filter(m => m.role === 'assistant' && m.modelID)

    const modelMap = new Map<string, { messages: number; cost: number }>()
    for (const msg of assistantMsgs) {
      const model = msg.modelID!
      const entry = modelMap.get(model) ?? { messages: 0, cost: 0 }
      entry.messages += 1
      entry.cost += msg.cost ?? 0
      modelMap.set(model, entry)
    }

    const totalMsgs = assistantMsgs.length
    let colorIdx = 0

    return [...modelMap.entries()]
      .map(([model, data]) => ({
        model,
        messages: data.messages,
        cost: data.cost,
        percentage: totalMsgs > 0 ? Math.round((data.messages / totalMsgs) * 100) : 0,
        color: getModelColor(model, colorIdx++),
      }))
      .sort((a, b) => b.messages - a.messages)
  }

  async getHourlyActivity(): Promise<HourlyActivity[]> {
    const allMessages = await this.getAllMessages()

    // 7x24 grid
    const grid = new Map<string, number>()
    for (const msg of allMessages) {
      const date = new Date(msg.time.created)
      const day = date.getDay() // 0=Sun
      const hour = date.getHours()
      const key = `${day}:${hour}`
      grid.set(key, (grid.get(key) ?? 0) + 1)
    }

    const result: HourlyActivity[] = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const count = grid.get(`${day}:${hour}`) ?? 0
        result.push({ day, hour, count })
      }
    }
    return result
  }

  async getSessionDetail(sessionId: string): Promise<SessionMessage[]> {
    const messages = await this.getSessionMessages(sessionId)

    // For each message, get text parts
    const results: SessionMessage[] = []
    for (const msg of messages.sort((a, b) => a.time.created - b.time.created)) {
      const parts = await this.getMessageParts(msg.id)
      const textParts = parts.filter(p => p.type === 'text' && p.text)
      const content = textParts.map(p => p.text).join('\n') || '(no text content)'

      results.push({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: content.slice(0, 500), // Truncate for dashboard display
        timestamp: msg.time.created,
        agent: msg.agent,
        model: msg.modelID,
        cost: msg.cost,
        tokens: msg.tokens ? {
          input: msg.tokens.input,
          output: msg.tokens.output,
          reasoning: msg.tokens.reasoning,
        } : undefined,
      })
    }

    return results
  }

  invalidateCache(): void {
    this.cache.invalidate()
  }
}
