import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { OpenCodeReader } from './opencode-reader'

type DateRange = 'today' | 'week' | 'month' | 'all'

export function createApp() {
  const app = new Hono()
  app.use('/*', cors())

  const reader = new OpenCodeReader()

  app.get('/api/stats', async (c) => {
    const range = (c.req.query('range') ?? 'all') as DateRange
    return c.json(await reader.getStats(range))
  })

  app.get('/api/agents/active', async (c) => {
    return c.json(await reader.getActiveAgents())
  })

  app.get('/api/sessions', async (c) => {
    const range = (c.req.query('range') ?? 'all') as DateRange
    return c.json(await reader.getSessions(range))
  })

  app.get('/api/sessions/:id/messages', async (c) => {
    return c.json(await reader.getSessionDetail(c.req.param('id')))
  })

  app.get('/api/agents/usage', async (c) => {
    const range = (c.req.query('range') ?? 'all') as DateRange
    return c.json(await reader.getAgentUsage(range))
  })

  app.get('/api/cost-history', async (c) => {
    return c.json(await reader.getCostHistory())
  })

  app.get('/api/models', async (c) => {
    return c.json(await reader.getModelUsage())
  })

  app.get('/api/activity', async (c) => {
    return c.json(await reader.getHourlyActivity())
  })

  return app
}

// Run directly with tsx (dev mode)
const isDirectRun = process.argv[1]?.endsWith('server/index.ts') ||
  process.argv[1]?.endsWith('server/index.js')

if (isDirectRun) {
  const app = createApp()
  const port = 3456
  console.log(`🚀 OhMyDashboard API running on http://localhost:${port}`)
  console.log(`📂 Reading data from ~/.local/share/opencode/storage/`)
  serve({ fetch: app.fetch, port })
}
