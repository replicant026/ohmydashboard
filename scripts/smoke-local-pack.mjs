#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const port = 51239
const host = '127.0.0.1'

function npmPackFilename() {
  const out = execSync('npm pack --json', { cwd: rootDir, encoding: 'utf8' })
  const parsed = JSON.parse(out)
  const first = Array.isArray(parsed) ? parsed[0] : parsed
  if (!first?.filename) {
    throw new Error('Unable to determine tarball filename from npm pack output')
  }
  return path.join(rootDir, first.filename)
}

async function waitForHealthy(baseUrl, timeoutMs = 25000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const [api, ui] = await Promise.all([
        fetch(`${baseUrl}/api/stats`),
        fetch(`${baseUrl}/`),
      ])

      if (api.ok && ui.ok) return
    } catch {
      // retry
    }

    await delay(500)
  }

  throw new Error(`Smoke server did not become healthy within ${timeoutMs}ms`)
}

const tarballPath = npmPackFilename()
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohmydashboard-smoke-'))
const installDir = path.join(tempDir, 'runner')
fs.mkdirSync(installDir, { recursive: true })

let child

try {
  execSync('npm init -y', { cwd: installDir, stdio: 'ignore' })
  execSync(`npm install "${tarballPath}"`, { cwd: installDir, stdio: 'inherit' })

  const binName = process.platform === 'win32' ? 'ohmydashboard.cmd' : 'ohmydashboard'
  const binPath = path.join(installDir, 'node_modules', '.bin', binName)

  child = spawn(binPath, ['--port', String(port), '--host', host], {
    cwd: installDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  await waitForHealthy(`http://${host}:${port}`)

  console.log('Smoke test (local packed tarball)')
  console.log('---------------------------------')
  console.log(`Tarball: ${path.basename(tarballPath)}`)
  console.log(`Install dir: ${installDir}`)
  console.log(`Health check: http://${host}:${port}/api/stats ✅`)
  console.log('UI check: / ✅')

  if (stderr.trim()) {
    console.log('\nCaptured stderr output (non-fatal):')
    console.log(stderr.trim())
  }
} finally {
  if (child && !child.killed) {
    child.kill('SIGTERM')
  }

  const tgzName = path.basename(tarballPath)
  const localTgzPath = path.join(rootDir, tgzName)
  if (fs.existsSync(localTgzPath)) {
    fs.unlinkSync(localTgzPath)
  }

  fs.rmSync(tempDir, { recursive: true, force: true })
}
