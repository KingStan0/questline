import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'tools', 'runner', 'runner.c')
const output = path.join(root, 'resources', 'runner.exe')

if (process.platform !== 'win32') {
  console.error('The runner currently targets Windows only.')
  process.exit(1)
}

const zigCandidates = [
  process.env.ZIG,
  'zig',
  path.join(process.env.LOCALAPPDATA || '', 'zig', 'zig.exe'),
].filter(Boolean)

let zig = null
for (const candidate of zigCandidates) {
  const result = spawnSync(candidate, ['version'], { encoding: 'utf8' })
  if (result.status === 0) {
    zig = candidate
    break
  }
}

if (!zig) {
  console.error(
    'Zig was not found. Install Zig (https://ziglang.org/download/) or set the ZIG environment variable.',
  )
  if (fs.existsSync(output)) {
    console.error('The existing resources/runner.exe was left untouched.')
    process.exit(0)
  }
  process.exit(1)
}

fs.mkdirSync(path.dirname(output), { recursive: true })
const result = spawnSync(
  zig,
  [
    'cc',
    '-target',
    'x86_64-windows-gnu',
    '-O2',
    '-s',
    '-municode',
    '-Wl,--subsystem,windows',
    source,
    '-o',
    output,
    '-luser32',
    '-lgdi32',
    '-lshell32',
  ],
  { stdio: 'inherit' },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`Runner built at ${output}`)
