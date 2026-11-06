import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'

export const DATA_SOURCES = {
  DISCORD: 'Discord API',
  BUNDLED: 'Bundled snapshot',
  CACHE: 'Cached snapshot',
}

const DISCORD_URL = 'https://discord.com/api/applications/detectable'

export function normalizeGameList(input) {
  if (!Array.isArray(input)) return []

  return input
    .filter(
      (game) =>
        game &&
        game.id &&
        typeof game.name === 'string' &&
        Array.isArray(game.executables) &&
        game.executables.length > 0,
    )
    .map((game) => ({
      id: String(game.id),
      name: game.name.trim(),
      aliases: Array.isArray(game.aliases)
        ? game.aliases.filter((alias) => typeof alias === 'string' && alias.trim())
        : [],
      icon:
        typeof game.icon_hash === 'string'
          ? game.icon_hash
          : typeof game.icon === 'string'
            ? game.icon
            : null,
      executables: game.executables
        .filter((executable) => executable && executable.name && executable.os)
        .map((executable) => ({
          name: String(executable.name),
          os: String(executable.os),
          is_launcher: Boolean(executable.is_launcher),
        })),
    }))
    .filter((game) => game.executables.length > 0)
}

export function isValidGameList(input) {
  return (
    Array.isArray(input) &&
    input.length > 1000 &&
    input[0] &&
    typeof input[0].name === 'string' &&
    Array.isArray(input[0].executables)
  )
}

async function readJson(file) {
  if (!existsSync(file)) return null
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return null
  }
}

async function fetchJson(url, timeoutMs = 30_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept: 'application/json',
      'user-agent': 'Questline/1.0 (+https://github.com/ibrahimarchive/questline)',
    },
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}

export async function loadGameData({ bundledPath, cachePath }) {
  const cached = await readJson(cachePath)
  if (cached && isValidGameList(cached.games)) {
    return {
      games: cached.games,
      source: cached.source || DATA_SOURCES.CACHE,
      updatedAt: cached.updatedAt || null,
      cached: true,
    }
  }

  const bundled = await readJson(bundledPath)
  if (!isValidGameList(bundled)) {
    throw new Error('The bundled game list is missing or invalid.')
  }

  let updatedAt = null
  try {
    updatedAt = (await fs.stat(bundledPath)).mtime.toISOString()
  } catch {
    // Not fatal; the list is still usable.
  }

  return {
    games: normalizeGameList(bundled),
    source: DATA_SOURCES.BUNDLED,
    updatedAt,
    cached: false,
  }
}

export async function refreshGameData({ cachePath, onProgress = () => {} }) {
  const attempts = [{ url: DISCORD_URL, source: DATA_SOURCES.DISCORD }]

  const errors = []

  for (const attempt of attempts) {
    try {
      onProgress(`Contacting ${attempt.source}...`)
      const raw = await fetchJson(attempt.url)
      if (!isValidGameList(raw)) {
        throw new Error('The response did not look like a Discord game list.')
      }
      const games = normalizeGameList(raw)
      const payload = {
        version: 2,
        source: attempt.source,
        updatedAt: new Date().toISOString(),
        games,
      }
      await fs.mkdir(cachePath.replace(/[\\/][^\\/]+$/, ''), { recursive: true })
      const temporary = `${cachePath}.tmp`
      await fs.writeFile(temporary, JSON.stringify(payload))
      await fs.rename(temporary, cachePath)
      onProgress(`${games.length.toLocaleString()} games synced.`)
      return {
        games,
        source: payload.source,
        updatedAt: payload.updatedAt,
        cached: false,
      }
    } catch (error) {
      errors.push(`${attempt.source}: ${error.message}`)
    }
  }

  throw new Error(`Could not refresh the game list. ${errors.join(' | ')}`)
}
