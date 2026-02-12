#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const packageJsonPath = path.join(rootDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const dryPackRaw = execSync('npm pack --json --dry-run', {
  cwd: rootDir,
  encoding: 'utf8',
})

const dryPack = JSON.parse(dryPackRaw)
const first = Array.isArray(dryPack) ? dryPack[0] : dryPack

if (!first?.files || !Array.isArray(first.files)) {
  console.error('❌ Unable to read dry-run pack file list from npm output.')
  process.exit(1)
}

const packedPaths = new Set(first.files.map((f) => f.path))

const requiredPackedFiles = [
  'bin/cli.ts',
  'server/index.ts',
  'server/opencode-reader.ts',
  'server/cache.ts',
  'dist/index.html',
]

const missingPackedFiles = requiredPackedFiles.filter((p) => !packedPaths.has(p))

const binTarget = pkg?.bin?.ohmydashboard
if (!binTarget) {
  console.error('❌ package.json missing `bin.ohmydashboard`.')
  process.exit(1)
}

const normalizedBin = String(binTarget).replace(/^\.\//, '')
if (!packedPaths.has(normalizedBin)) {
  console.error(`❌ bin target is not included in packed files: ${normalizedBin}`)
  process.exit(1)
}

if (missingPackedFiles.length > 0) {
  console.error(`❌ Missing required packed files: ${missingPackedFiles.join(', ')}`)
  process.exit(1)
}

console.log('Pack integrity check')
console.log('--------------------')
console.log(`Tarball name (dry-run): ${first.filename}`)
console.log(`Packed file count: ${first.files.length}`)
console.log(`bin target: ${normalizedBin}`)
console.log('✅ Required runtime and UI artifacts are present in pack output.')
