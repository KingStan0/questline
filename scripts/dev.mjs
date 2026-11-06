import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const electronBin = path.join(
  root,
  'node_modules',
  'electron',
  'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron',
)

const url = 'http://localhost:5173'

const vite = spawn(process.execPath, [viteBin, '--port', '5173', '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
})

let electron = null
let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (vite && !vite.killed) vite.kill()
  setTimeout(() => process.exit(code), 600)
}

async function waitForServer() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  return false
}

vite.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`Vite exited with code ${code ?? 1}.`)
    shutdown(code ?? 1)
  }
})

const ready = await waitForServer()
if (!ready) {
  console.error('Vite did not become ready in time.')
  shutdown(1)
} else {
  electron = spawn(electronBin, ['.'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
  })

  electron.on('exit', (code) => {
    if (!shuttingDown) {
      shuttingDown = true
      if (!vite.killed) vite.kill()
      process.exit(code ?? 0)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
