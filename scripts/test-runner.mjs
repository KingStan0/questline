import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { RunnerService } from '../electron/runner-service.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const gamesDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'questline-test-'))
const runnerPath = path.join(root, 'resources', 'runner.exe')
const events = []

const service = new RunnerService({
  gamesDirectory,
  runnerPath,
  onEvent: (event) => events.push(event),
})

const gameId = '700136079562375258'
const executableName = 'win64/valorant-win64-shipping.exe'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  const installed = await service.install({ gameId, executableName })
  assert(installed.installed, 'The runner was not installed.')

  const status = await fs.stat(installed.path)
  assert(status.size > 0, 'The installed runner is empty.')

  const launched = await service.launch({
    gameId,
    gameName: 'VALORANT',
    executableName,
  })
  assert(launched.pid > 0, 'The runner did not return a process id.')

  await new Promise((resolve) => setTimeout(resolve, 1200))

  const running = await service.listRunning()
  assert(
    running.some((session) => session.gameId === gameId),
    'The runner was not discovered in the process list.',
  )

  const stopped = await service.stop({ gameId, executableName })
  assert(stopped.stopped >= 1, 'The runner was not stopped.')

  await new Promise((resolve) => setTimeout(resolve, 400))
  const remaining = await service.listRunning()
  assert(remaining.length === 0, 'The runner is still running after stop.')

  console.log('Runner smoke test passed.')
  console.log(`  Install: ${installed.path}`)
  console.log(`  Launch:  pid ${launched.pid}`)
  console.log(`  Stop:    ${stopped.stopped} process(es)`)
} finally {
  await service.stopAll()
  await fs.rm(gamesDirectory, { recursive: true, force: true })
}
