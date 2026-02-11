#!/usr/bin/env bun

import { parseArgs } from 'util'
import { join } from 'path'
import { createApp } from '../server/index'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: 'string', short: 'p', default: '51234' },
    host: { type: 'string', short: 'h', default: '127.0.0.1' },
  },
  allowPositionals: false,
})

const port = parseInt(values.port!, 10)
const host = values.host!
const distDir = join(import.meta.dir, '..', 'dist')

const app = createApp()

const server = Bun.serve({
  hostname: host,
  port,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname.startsWith('/api/')) {
      return app.fetch(req)
    }

    const ext = url.pathname.includes('.') ? url.pathname.slice(url.pathname.lastIndexOf('.')) : ''

    if (ext) {
      const file = Bun.file(join(distDir, url.pathname))
      if (await file.exists()) {
        return new Response(file, {
          headers: { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream' },
        })
      }
      return new Response('Not Found', { status: 404 })
    }

    const indexFile = Bun.file(join(distDir, 'index.html'))
    return new Response(indexFile, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  },
})

console.log()
console.log('  \x1b[36m◉\x1b[0m \x1b[1mOhMyDashboard\x1b[0m')
console.log()
console.log(`  \x1b[32m→\x1b[0m http://${server.hostname}:${server.port}`)
console.log(`  \x1b[90m📂 ~/.local/share/opencode/storage/\x1b[0m`)
console.log()
