import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { OpenCodeReader } from './opencode-reader'

type DateRange = 'today' | 'week' | 'month' | 'all'

const app = new Hono()
app.use('/*', cors())

const reader = new OpenCodeReader()

app.get('/api/stats', async (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  const stats = await reader.getStats(range)
  return c.json(stats)
})

app.get('/api/agents/active', async (c) => {
  const agents = await reader.getActiveAgents()
  return c.json(agents)
})

app.get('/api/sessions', async (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  const sessions = await reader.getSessions(range)
  return c.json(sessions)
})

app.get('/api/sessions/:id/messages', async (c) => {
  const id = c.req.param('id')
  const messages = await reader.getSessionDetail(id)
  return c.json(messages)
})

app.get('/api/agents/usage', async (c) => {
  const range = (c.req.query('range') ?? 'all') as DateRange
  const usage = await reader.getAgentUsage(range)
  return c.json(usage)
})

app.get('/api/cost-history', async (c) => {
  const history = await reader.getCostHistory()
  return c.json(history)
})

app.get('/api/models', async (c) => {
  const models = await reader.getModelUsage()
  return c.json(models)
})

app.get('/api/activity', async (c) => {
  const activity = await reader.getHourlyActivity()
  return c.json(activity)
})

const port = 3456
console.log(`🚀 OhMyDashboard API running on http://localhost:${port}`)
console.log(`📂 Reading data from ~/.local/share/opencode/storage/`)

serve({ fetch: app.fetch, port })
