#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const packageJsonPath = path.join(rootDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const dependencies = new Set(Object.keys(packageJson.dependencies ?? {}))
const devDependencies = new Set(Object.keys(packageJson.devDependencies ?? {}))

const entrypoint = path.join(rootDir, 'bin', 'cli.ts')
const visited = new Set()
const externalModules = new Set()

const BUILTIN_MODULES = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'crypto', 'dgram', 'dns',
  'events', 'fs', 'http', 'https', 'module', 'net', 'os', 'path', 'process', 'stream',
  'string_decoder', 'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib', 'node:assert',
  'node:buffer', 'node:child_process', 'node:crypto', 'node:events', 'node:fs', 'node:http',
  'node:https', 'node:module', 'node:net', 'node:os', 'node:path', 'node:process',
  'node:stream', 'node:timers', 'node:url', 'node:util', 'node:vm', 'node:zlib',
])

function normalizePackageName(specifier) {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/')
    return `${scope}/${name}`
  }
  return specifier.split('/')[0]
}

function resolveLocalImport(filePath, specifier) {
  const baseDir = path.dirname(filePath)
  const target = path.resolve(baseDir, specifier)
  const candidates = [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    `${target}.js`,
    `${target}.mjs`,
    `${target}.cjs`,
    path.join(target, 'index.ts'),
    path.join(target, 'index.tsx'),
    path.join(target, 'index.js'),
    path.join(target, 'index.mjs'),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate))
}

function walkRuntimeImports(filePath) {
  if (visited.has(filePath)) return
  visited.add(filePath)

  const source = fs.readFileSync(filePath, 'utf8')
  const importRegex = /(?:import\s+(?:[^'"`]+?\s+from\s+)?|import\s*\(\s*|export\s+[^'"`]*?from\s+|require\s*\()\s*['"`]([^'"`]+)['"`]/g

  for (const match of source.matchAll(importRegex)) {
    const specifier = match[1]
    if (!specifier) continue

    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      const resolved = resolveLocalImport(filePath, specifier)
      if (resolved) walkRuntimeImports(resolved)
      continue
    }

    const pkg = normalizePackageName(specifier)
    if (!BUILTIN_MODULES.has(specifier) && !BUILTIN_MODULES.has(pkg)) {
      externalModules.add(pkg)
    }
  }
}

walkRuntimeImports(entrypoint)

const missingInDependencies = []
const runtimeInDevDependencies = []

for (const mod of externalModules) {
  if (devDependencies.has(mod) && !dependencies.has(mod)) {
    runtimeInDevDependencies.push(mod)
  }

  if (!dependencies.has(mod)) {
    missingInDependencies.push(mod)
  }
}

console.log('Runtime import audit')
console.log('--------------------')
console.log(`Entrypoint: ${path.relative(rootDir, entrypoint)}`)
console.log(`Scanned files: ${visited.size}`)
console.log(`Runtime external modules: ${[...externalModules].sort().join(', ') || '(none)'}`)

if (runtimeInDevDependencies.length > 0) {
  console.error(`\n❌ Runtime modules incorrectly placed in devDependencies: ${runtimeInDevDependencies.join(', ')}`)
}

if (missingInDependencies.length > 0) {
  console.error(`\n❌ Runtime modules missing from dependencies: ${missingInDependencies.join(', ')}`)
  process.exit(1)
}

console.log('\n✅ Runtime import dependency classification is valid.')
