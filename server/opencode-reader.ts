import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { TTLCache } from './cache'

const execFileAsync = promisify(execFile)

type BunSqliteDatabase = {
  query: (sql: string) => { all: () => unknown[] }
  close?: () => void
}

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
  totalTokens: number
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

const DEFAULT_STORAGE_BASE = path.join(os.homedir(), '.local', 'share', 'opencode', 'storage')
const DEFAULT_DB_PATH = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db')

type StorageBackend =
  | { type: 'json'; storageBase: string }
  | { type: 'sqlite'; storageBase: string; dbPath: string }

function getStorageCandidates(): string[] {
  const candidates = [
    process.env.OPENCODE_STORAGE_PATH,
    process.env.OPENCODE_STORAGE,
    process.env.XDG_DATA_HOME ? path.join(process.env.XDG_DATA_HOME, 'opencode/storage') : null,
    DEFAULT_STORAGE_BASE,
  ]

  if (process.platform === 'win32') {
    candidates.push(
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'opencode/storage') : null,
      path.join(os.homedir(), 'AppData', 'Local', 'opencode', 'storage'),
      path.join(os.homedir(), '.local', 'share', 'opencode', 'storage'),
      path.join(os.homedir(), '.opencode', 'storage'),
    )
  }

  return candidates.filter((p): p is string => Boolean(p))
}

async function resolveStorageBase(): Promise<string> {
  for (const candidate of getStorageCandidates()) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isDirectory()) return candidate
    } catch {
      // try next candidate
    }
  }
  return DEFAULT_STORAGE_BASE
}

function getDbPathCandidates(): string[] {
  const candidates = [
    process.env.OPENCODE_DB_PATH,
    process.env.XDG_DATA_HOME ? path.join(process.env.XDG_DATA_HOME, 'opencode/opencode.db') : null,
    DEFAULT_DB_PATH,
  ]

  if (process.platform === 'win32') {
    candidates.push(
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'opencode/opencode.db') : null,
      path.join(os.homedir(), 'AppData', 'Local', 'opencode', 'opencode.db'),
      path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db'),
    )
  }

  return candidates.filter((p): p is string => Boolean(p))
}

async function resolveDbPath(): Promise<string | null> {
  for (const candidate of getDbPathCandidates()) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) return candidate
    } catch {
      // try next candidate
    }
  }
  return null
}

async function hasJsonSessions(storageBase: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(path.join(storageBase, 'session'), { withFileTypes: true })
    return entries.some((entry) => entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.json')))
  } catch {
    return false
  }
}

async function resolveBackend(): Promise<StorageBackend> {
  const storageBase = await resolveStorageBase()
  if (await hasJsonSessions(storageBase)) {
    return { type: 'json', storageBase }
  }

  const dbPath = await resolveDbPath()
  if (dbPath) {
    return { type: 'sqlite', storageBase, dbPath }
  }

  return { type: 'json', storageBase }
}

function getStringField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return ''
}

function getNumberField(row: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function normalizeTimestamp(value?: number): number {
  if (!value || !Number.isFinite(value)) return Date.now()
  return value < 1_000_000_000_000 ? value * 1000 : value
}

function getTimeField(row: Record<string, unknown>): { created: number; updated: number } {
  const rawTime = row.time
  if (typeof rawTime === 'string') {
    try {
      const parsed = JSON.parse(rawTime) as { created?: number; updated?: number }
      const created = normalizeTimestamp(parsed.created)
      const updated = normalizeTimestamp(parsed.updated ?? parsed.created)
      return { created, updated }
    } catch {
      // fallback to flat fields
    }
  }
  if (rawTime && typeof rawTime === 'object') {
    const timeObj = rawTime as { created?: number; updated?: number }
    const created = normalizeTimestamp(timeObj.created)
    const updated = normalizeTimestamp(timeObj.updated ?? timeObj.created)
    return { created, updated }
  }

  const created = normalizeTimestamp(getNumberField(row, ['created', 'createdAt', 'created_at', 'time_created']))
  const updated = normalizeTimestamp(getNumberField(row, ['updated', 'updatedAt', 'updated_at', 'time_updated']) ?? created)
  return { created, updated }
}

function parseTokens(value: unknown): RawMessage['tokens'] | undefined {
  if (!value) return undefined
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return undefined
    }
  }
  if (!parsed || typeof parsed !== 'object') return undefined
  const tokenObj = parsed as Record<string, unknown>
  const cacheObj = (tokenObj.cache && typeof tokenObj.cache === 'object') ? tokenObj.cache as Record<string, unknown> : {}

  return {
    input: Number(tokenObj.input ?? 0),
    output: Number(tokenObj.output ?? 0),
    reasoning: Number(tokenObj.reasoning ?? 0),
    cache: {
      read: Number(cacheObj.read ?? 0),
      write: Number(cacheObj.write ?? 0),
    },
  }
}

function asRecordArray(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return []
  return data.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''")
}

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
  private backendPromise: Promise<StorageBackend>
  private storageBasePromise: Promise<string>
  private bunSqliteDb: BunSqliteDatabase | null = null
  private bunSqliteDbPath: string | null = null
  private bunSqliteUnavailable = false

  constructor() {
    this.backendPromise = resolveBackend()
    this.storageBasePromise = this.backendPromise.then((backend) => backend.storageBase)
  }

  async getStorageBase(): Promise<string> {
    return this.storageBasePromise
  }

  private async cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key) as T | null
    if (cached) return cached
    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }

  async getBackendInfo(): Promise<StorageBackend> {
    return this.backendPromise
  }

  private async sqliteQueryViaBun(sql: string): Promise<Record<string, unknown>[] | null> {
    if (this.bunSqliteUnavailable) return null

    const backend = await this.getBackendInfo()
    if (backend.type !== 'sqlite') return []

    try {
      if (!this.bunSqliteDb || this.bunSqliteDbPath !== backend.dbPath) {
        this.bunSqliteDb?.close?.()
        const sqliteModule = await import('bun:sqlite')
        const BunDatabase = sqliteModule.Database as unknown as new (dbPath: string, options?: { readonly?: boolean }) => BunSqliteDatabase
        this.bunSqliteDb = new BunDatabase(backend.dbPath, { readonly: true })
        this.bunSqliteDbPath = backend.dbPath
      }

      return asRecordArray(this.bunSqliteDb.query(sql).all())
    } catch {
      this.bunSqliteUnavailable = true
      this.bunSqliteDb?.close?.()
      this.bunSqliteDb = null
      this.bunSqliteDbPath = null
      return null
    }
  }

  private async sqliteQuery(sql: string): Promise<Record<string, unknown>[]> {
    const backend = await this.getBackendInfo()
    if (backend.type !== 'sqlite') return []

    const bunRows = await this.sqliteQueryViaBun(sql)
    if (bunRows) return bunRows

    try {
      const { stdout } = await execFileAsync('sqlite3', [backend.dbPath, '-json', sql], { maxBuffer: 20 * 1024 * 1024 })
      return asRecordArray(JSON.parse(stdout || '[]'))
    } catch {
      return []
    }
  }

  private async sqliteTableColumns(table: string): Promise<Set<string>> {
    const rows = await this.sqliteQuery(`PRAGMA table_info(${table});`)
    return new Set(rows.map((row) => String(row.name ?? '')))
  }

  private async sqliteLoadSessions(): Promise<RawSession[]> {
    const rows = await this.sqliteQuery('SELECT * FROM session;')
    return rows.map((row) => {
      const id = getStringField(row, ['id'])
      const title = getStringField(row, ['title', 'slug'])
      const slug = getStringField(row, ['slug', 'title'])
      return {
        id,
        slug,
        version: getStringField(row, ['version']),
        projectID: getStringField(row, ['projectID', 'project_id', 'projectId']),
        directory: getStringField(row, ['directory', 'worktree', 'cwd']),
        parentID: getStringField(row, ['parentID', 'parent_id', 'parentId']) || undefined,
        title,
        time: getTimeField(row),
      }
    }).filter((row) => row.id || row.slug)
  }

  private async sqliteLoadMessages(sessionId?: string): Promise<RawMessage[]> {
    const where = sessionId ? ` WHERE sessionID = '${escapeSqlString(sessionId)}' OR session_id = '${escapeSqlString(sessionId)}' OR sessionId = '${escapeSqlString(sessionId)}'` : ''
    const rows = await this.sqliteQuery(`SELECT * FROM message${where};`)

    return rows.map((row) => ({
      id: getStringField(row, ['id']),
      sessionID: getStringField(row, ['sessionID', 'session_id', 'sessionId']),
      role: getStringField(row, ['role']) || 'assistant',
      time: getTimeField(row),
      parentID: getStringField(row, ['parentID', 'parent_id', 'parentId']) || undefined,
      modelID: getStringField(row, ['modelID', 'model_id', 'modelId']) || undefined,
      providerID: getStringField(row, ['providerID', 'provider_id', 'providerId']) || undefined,
      mode: getStringField(row, ['mode']) || undefined,
      agent: getStringField(row, ['agent']) || undefined,
      cost: getNumberField(row, ['cost']),
      tokens: parseTokens(row.tokens),
      finish: getStringField(row, ['finish']) || undefined,
    })).filter((msg) => msg.id && msg.sessionID)
  }

  private async sqliteLoadParts(messageId: string): Promise<RawPart[]> {
    const rows = await this.sqliteQuery(
      `SELECT * FROM part WHERE messageID = '${escapeSqlString(messageId)}' OR message_id = '${escapeSqlString(messageId)}' OR messageId = '${escapeSqlString(messageId)}';`
    )

    return rows.map((row) => ({
      id: getStringField(row, ['id']),
      sessionID: getStringField(row, ['sessionID', 'session_id', 'sessionId']),
      messageID: getStringField(row, ['messageID', 'message_id', 'messageId']),
      type: getStringField(row, ['type']) || 'text',
      text: getStringField(row, ['text']) || undefined,
      cost: getNumberField(row, ['cost']),
      tokens: parseTokens(row.tokens),
    })).filter((part) => part.id && part.messageID)
  }

  // --- Raw data readers ---

  async getAllProjects(): Promise<RawProject[]> {
    return this.cachedFetch('projects', async () => {
      const backend = await this.getBackendInfo()
      if (backend.type === 'sqlite') {
        const columns = await this.sqliteTableColumns('project')
        if (columns.size === 0) return []
        const rows = await this.sqliteQuery('SELECT * FROM project;')
        return rows.map((row) => ({
          id: getStringField(row, ['id']),
          worktree: getStringField(row, ['worktree', 'directory']),
          vcs: getStringField(row, ['vcs']) || 'unknown',
          time: getTimeField(row),
        })).filter((project) => project.id)
      }

      const storageBase = await this.getStorageBase()
      return readJsonDir<RawProject>(path.join(storageBase, 'project'))
    })
  }

  async getAllSessions(): Promise<RawSession[]> {
    return this.cachedFetch('sessions', async () => {
      const backend = await this.getBackendInfo()
      if (backend.type === 'sqlite') return this.sqliteLoadSessions()

      const storageBase = await this.getStorageBase()
      return readNestedJsonDir<RawSession>(path.join(storageBase, 'session'))
    })
  }

  async getAllMessages(): Promise<RawMessage[]> {
    return this.cachedFetch('messages', async () => {
      const backend = await this.getBackendInfo()
      if (backend.type === 'sqlite') return this.sqliteLoadMessages()

      const storageBase = await this.getStorageBase()
      return readNestedJsonDir<RawMessage>(path.join(storageBase, 'message'))
    })
  }

  async getSessionMessages(sessionId: string): Promise<RawMessage[]> {
    return this.cachedFetch(`messages:${sessionId}`, async () => {
      const backend = await this.getBackendInfo()
      if (backend.type === 'sqlite') return this.sqliteLoadMessages(sessionId)

      const storageBase = await this.getStorageBase()
      return readJsonDir<RawMessage>(path.join(storageBase, 'message', sessionId))
    })
  }

  async getMessageParts(messageId: string): Promise<RawPart[]> {
    const backend = await this.getBackendInfo()
    if (backend.type === 'sqlite') return this.sqliteLoadParts(messageId)

    const storageBase = await this.getStorageBase()
    return readJsonDir<RawPart>(path.join(storageBase, 'part', messageId))
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
    const [sessions, allMessages] = await Promise.all([
      this.getSessions(range),
      this.getAllMessages(),
    ])
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0)
    const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0)

    // Sum tokens from all messages within range
    const cutoff = getCutoff(range)
    const rangeMessages = allMessages.filter(m => m.time.created >= cutoff)
    const totalTokens = rangeMessages.reduce((sum, m) => {
      if (!m.tokens) return sum
      return sum + m.tokens.input + m.tokens.output + m.tokens.reasoning
    }, 0)

    // "Active" = sessions updated within the last 5 minutes
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const activeAgents = sessions.filter(s => s.time.updated >= fiveMinAgo).length

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalCost,
      totalTokens,
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
