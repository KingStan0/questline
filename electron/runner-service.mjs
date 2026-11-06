import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const POWERSHELL = 'powershell.exe'
const POWERSHELL_ARGS = [
  '-NoProfile',
  '-NonInteractive',
  '-ExecutionPolicy',
  'Bypass',
  '-Command',
]

const PROCESS_QUERY = `
$ErrorActionPreference = 'SilentlyContinue'
$paths = @()
if ($env:QUESTLINE_PATHS) {
  $paths = @($env:QUESTLINE_PATHS | ConvertFrom-Json)
}
if ($paths.Count -eq 0) {
  Write-Output '[]'
  exit 0
}
$result = Get-CimInstance Win32_Process | Where-Object {
  $exe = $_.ExecutablePath
  $exe -and ($paths -contains $exe)
} | ForEach-Object {
  [PSCustomObject]@{
    ProcessId = [int]$_.ProcessId
    Path = [string]$_.ExecutablePath
    StartedAt = if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { $null }
  }
}
Write-Output (ConvertTo-Json -InputObject @($result) -Compress)
`

const ROOT_QUERY = `
$ErrorActionPreference = 'SilentlyContinue'
$root = [string]$env:QUESTLINE_ROOT
if (-not $root) {
  Write-Output '[]'
  exit 0
}
$result = Get-CimInstance Win32_Process | Where-Object {
  $exe = $_.ExecutablePath
  $exe -and $exe.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
} | ForEach-Object {
  [PSCustomObject]@{
    ProcessId = [int]$_.ProcessId
    Path = [string]$_.ExecutablePath
    StartedAt = if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { $null }
  }
}
Write-Output (ConvertTo-Json -InputObject @($result) -Compress)
`

const KILL_ROOT = `
$ErrorActionPreference = 'SilentlyContinue'
$root = [string]$env:QUESTLINE_ROOT
if (-not $root) {
  Write-Output '0'
  exit 0
}
$targets = Get-CimInstance Win32_Process | Where-Object {
  $exe = $_.ExecutablePath
  $exe -and $exe.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
}
$count = 0
foreach ($target in @($targets)) {
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
  $count++
}
Write-Output ([string]$count)
`

const KILL_PATHS = `
$ErrorActionPreference = 'SilentlyContinue'
$paths = @()
if ($env:QUESTLINE_PATHS) {
  $paths = @($env:QUESTLINE_PATHS | ConvertFrom-Json)
}
if ($paths.Count -eq 0) {
  Write-Output '0'
  exit 0
}
$targets = Get-CimInstance Win32_Process | Where-Object {
  $exe = $_.ExecutablePath
  $exe -and ($paths -contains $exe)
}
$count = 0
foreach ($target in @($targets)) {
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
  $count++
}
Write-Output ([string]$count)
`

function isValidGameId(gameId) {
  return typeof gameId === 'string' && /^\d{1,25}$/.test(gameId)
}

function splitExecutableName(executableName) {
  if (typeof executableName !== 'string' || !executableName.trim()) {
    throw new Error('The game executable name is empty.')
  }

  const normalized = executableName.replace(/\//g, '\\')
  if (/^[a-zA-Z]:/.test(normalized) || normalized.startsWith('\\')) {
    throw new Error('Absolute executable paths are not allowed.')
  }

  const segments = normalized.split('\\').filter(Boolean)
  if (segments.length === 0) {
    throw new Error('The game executable name is invalid.')
  }

  for (const segment of segments) {
    if (segment === '.' || segment === '..') {
      throw new Error('Relative path segments are not allowed.')
    }
    if (/[<>:"|?*\u0000-\u001f]/.test(segment)) {
      throw new Error(`The executable path contains an invalid character: ${segment}`)
    }
    if (/[. ]$/.test(segment)) {
      throw new Error(`The executable path contains an invalid trailing character: ${segment}`)
    }
  }

  return segments
}

function pathKey(filePath) {
  return path.resolve(filePath).toLowerCase()
}

async function runPowerShell(script, environment = {}) {
  const { stdout } = await execFileAsync(POWERSHELL, [...POWERSHELL_ARGS, script], {
    env: { ...process.env, ...environment },
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  })
  return stdout.trim()
}

function parseProcessList(output) {
  if (!output) return []
  try {
    const parsed = JSON.parse(output)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list
      .filter((entry) => entry && Number.isInteger(entry.ProcessId) && entry.Path)
      .map((entry) => ({
        pid: entry.ProcessId,
        path: String(entry.Path),
        startedAt: entry.StartedAt || new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

export class RunnerService {
  constructor({ gamesDirectory, runnerPath, onEvent = () => {} }) {
    this.gamesDirectory = path.resolve(gamesDirectory)
    this.runnerPath = runnerPath
    this.onEvent = onEvent
    this.sessions = new Map()
  }

  setGamesDirectory(directory) {
    this.gamesDirectory = path.resolve(directory)
  }

  setRunnerPath(runnerPath) {
    this.runnerPath = runnerPath
  }

  sessionKey(gameId, executableName) {
    return `${gameId}::${executableName.toLowerCase()}`
  }

  targetFor(gameId, executableName) {
    if (!isValidGameId(gameId)) {
      throw new Error('The game id is invalid.')
    }
    const segments = splitExecutableName(executableName)
    const filename = segments.pop()
    const folder = path.resolve(this.gamesDirectory, gameId, ...segments)
    const target = path.resolve(folder, filename)
    const relative = path.relative(path.resolve(this.gamesDirectory), target)
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('The executable path escapes the games folder.')
    }
    return { target, folder, filename, executableName }
  }

  async ensureRoot() {
    await fs.mkdir(this.gamesDirectory, { recursive: true })
  }

  async inspect(gameId, executables) {
    const result = await this.inspectMany([{ gameId, executables }])
    return result[gameId] || {}
  }

  async inspectMany(games) {
    if (!Array.isArray(games)) throw new Error('Missing game data.')

    const groups = games.map((game) => {
      if (!game || !isValidGameId(String(game.gameId))) {
        throw new Error('The game id is invalid.')
      }
      const gameId = String(game.gameId)
      const rows = (Array.isArray(game.executables) ? game.executables : [])
        .filter((entry) => entry && typeof entry.name === 'string')
        .map((entry) => {
          const { target } = this.targetFor(gameId, entry.name)
          return { executable: entry.name, os: entry.os, target }
        })
      return { gameId, rows }
    })

    const allPaths = groups.flatMap((group) => group.rows.map((row) => row.target))
    const processes = await this.findProcessesByPaths(allPaths)
    const byPath = new Map(processes.map((entry) => [pathKey(entry.path), entry]))

    const result = {}
    for (const group of groups) {
      const gameResult = {}
      for (const row of group.rows) {
        const process = byPath.get(pathKey(row.target))
        gameResult[row.executable] = {
          installed: existsSync(row.target),
          running: Boolean(process),
          pid: process?.pid ?? null,
          startedAt: process?.startedAt ?? null,
          path: row.target,
        }
      }
      result[group.gameId] = gameResult
    }

    return result
  }

  async install({ gameId, executableName }) {
    const { target, folder } = this.targetFor(gameId, executableName)

    if (!existsSync(this.runnerPath)) {
      throw new Error(
        'The runner executable is missing. Run "npm run runner:build" to create it.',
      )
    }

    await fs.mkdir(folder, { recursive: true })

    // Never overwrite a runner that is currently in use. Windows would reject
    // the write anyway, but returning a useful message is friendlier.
    const running = await this.findProcessesByPaths([target])
    if (running.length === 0) {
      await fs.copyFile(this.runnerPath, target)
    }

    return { installed: true, path: target }
  }

  async launch({ gameId, gameName, executableName }) {
    const { target, folder, filename } = this.targetFor(gameId, executableName)
    const displayName =
      typeof gameName === 'string' && gameName.trim() ? gameName.trim() : filename

    const existing = await this.findProcessesByPaths([target])
    if (existing.length > 0) {
      const process = existing[0]
      const session = this.remember({
        gameId,
        gameName: displayName,
        executableName,
        path: target,
        pid: process.pid,
        startedAt: process.startedAt,
      })
      return { ...session, alreadyRunning: true }
    }

    await this.install({ gameId, executableName })

    const child = spawn(target, ['--title', displayName], {
      cwd: folder,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })

    if (!child.pid) {
      throw new Error('The runner process did not start.')
    }

    const session = this.remember({
      gameId,
      gameName: displayName,
      executableName,
      path: target,
      pid: child.pid,
      startedAt: new Date().toISOString(),
    })

    child.once('error', (error) => {
      this.forget(gameId, executableName)
      this.onEvent({ type: 'error', session, message: error.message })
    })

    child.once('exit', () => {
      const removed = this.forget(gameId, executableName)
      if (removed) {
        this.onEvent({ type: 'ended', session: removed })
      }
    })

    child.unref()

    return { ...session, alreadyRunning: false }
  }

  remember(session) {
    const value = {
      ...session,
      key: this.sessionKey(session.gameId, session.executableName),
    }
    this.sessions.set(value.key, value)
    return value
  }

  forget(gameId, executableName) {
    const key = this.sessionKey(gameId, executableName)
    const value = this.sessions.get(key)
    if (value) this.sessions.delete(key)
    return value
  }

  async stop({ gameId, executableName }) {
    const { target } = this.targetFor(gameId, executableName)
    const processes = await this.findProcessesByPaths([target])
    let stopped = 0

    for (const process of processes) {
      if (await this.killPid(process.pid)) stopped++
    }

    const session = this.forget(gameId, executableName)
    if (stopped === 0 && session) {
      if (await this.killPid(session.pid)) stopped++
    }

    return { stopped }
  }

  async stopAll() {
    await this.ensureRoot()
    let stopped = 0
    try {
      const output = await runPowerShell(KILL_ROOT, {
        QUESTLINE_ROOT: this.gamesDirectory,
      })
      stopped = Number.parseInt(output, 10) || 0
    } catch {
      // Fall back to the sessions we know about.
      for (const session of [...this.sessions.values()]) {
        if (await this.killPid(session.pid)) stopped++
      }
    }

    const ended = [...this.sessions.values()]
    this.sessions.clear()
    for (const session of ended) {
      this.onEvent({ type: 'ended', session })
    }

    return { stopped }
  }

  async listRunning() {
    await this.ensureRoot()
    let processes = []
    try {
      const output = await runPowerShell(ROOT_QUERY, {
        QUESTLINE_ROOT: this.gamesDirectory,
      })
      processes = parseProcessList(output)
    } catch {
      processes = [...this.sessions.values()].map((session) => ({
        pid: session.pid,
        path: session.path,
        startedAt: session.startedAt,
      }))
    }

    const root = path.resolve(this.gamesDirectory)
    const discovered = []

    for (const process of processes) {
      const relative = path.relative(root, process.path)
      if (!relative || relative.startsWith('..')) continue
      const segments = relative.split(path.sep)
      if (segments.length < 2) continue
      const gameId = segments[0]
      const executableName = segments.slice(1).join('\\')
      const known = this.sessions.get(this.sessionKey(gameId, executableName))
      discovered.push({
        key: this.sessionKey(gameId, executableName),
        gameId,
        gameName: known?.gameName ?? null,
        executableName,
        path: process.path,
        pid: process.pid,
        startedAt: known?.startedAt ?? process.startedAt,
      })
    }

    return discovered
  }

  async findProcessesByPaths(paths) {
    if (!paths.length) return []
    try {
      const output = await runPowerShell(PROCESS_QUERY, {
        QUESTLINE_PATHS: JSON.stringify(paths),
      })
      return parseProcessList(output)
    } catch {
      return []
    }
  }

  async killPid(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false
    try {
      await execFileAsync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        timeout: 10_000,
      })
      return true
    } catch {
      return false
    }
  }
}

export function makeRunnerPath(rootDirectory, isPackaged) {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'runner.exe')
  }
  return path.join(rootDirectory, 'resources', 'runner.exe')
}
