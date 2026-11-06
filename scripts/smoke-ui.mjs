import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const electronBin =
  process.env.QUESTLINE_UI_EXE ||
  path.join(
    root,
    'node_modules',
    'electron',
    'dist',
    process.platform === 'win32' ? 'electron.exe' : 'electron',
  )
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'questline-ui-'))
const port = 9323
const screenshotDirectory = process.env.QUESTLINE_SCREENSHOT_DIR
  ? path.resolve(root, process.env.QUESTLINE_SCREENSHOT_DIR)
  : path.join(root, 'screenshots')
const screenshots = {
  session: path.join(screenshotDirectory, 'questline-session.png'),
  activity: path.join(screenshotDirectory, 'questline-activity.png'),
  settings: path.join(screenshotDirectory, 'questline-settings.png'),
  light: path.join(screenshotDirectory, 'questline-light.png'),
}
const screenshotPath = screenshots.session
const output = []

await fs.mkdir(path.dirname(screenshotPath), { recursive: true })

const child = spawn(
  electronBin,
  process.env.QUESTLINE_UI_EXE ? [`--remote-debugging-port=${port}`] : ['.', `--remote-debugging-port=${port}`],
  {
    cwd: root,
    env: { ...process.env, QUESTLINE_USER_DATA: profile },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: false,
  },
)

child.stdout.on('data', (chunk) => output.push(chunk.toString()))
child.stderr.on('data', (chunk) => output.push(chunk.toString()))

let cdp = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForTarget() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = await response.json()
      const page = targets.find(
        (target) => target.type === 'page' && /index\.html|localhost/.test(target.url),
      )
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      // Electron is still starting.
    }
    await sleep(300)
  }
  throw new Error('Electron did not expose a debugger target in time.')
}

class CdpClient {
  constructor(socket) {
    this.socket = socket
    this.id = 0
    this.pending = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) reject(new Error(message.error.message))
        else resolve(message.result)
      }
    })
  }

  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

async function evaluate(expression, awaitPromise = false) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
    userGesture: true,
  })
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        'Renderer evaluation failed.',
    )
  }
  return result.result.value
}

async function waitFor(expression, description, timeout = 15_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return
    await sleep(200)
  }
  throw new Error(`Timed out waiting for ${description}.`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function capture(name) {
  await waitFor(
    `document.querySelectorAll('.toast').length === 0`,
    'notifications to clear',
    8_000,
  )
  await evaluate(`document.querySelector('.app-content')?.scrollTo({ top: 0 })`)

  if (name === 'settings') {
    await evaluate(`(() => {
      const replacements = [
        'C:\\\\Games\\\\Questline',
        'C:\\\\Program Files\\\\Questline\\\\resources\\\\runner.exe',
        'C:\\\\Users\\\\You\\\\AppData\\\\Roaming\\\\Questline',
      ]
      document.querySelectorAll('.settings-page .mono-path').forEach((node, index) => {
        if (replacements[index]) node.textContent = replacements[index]
      })
    })()`)
  }

  await sleep(300)
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(screenshots[name], Buffer.from(screenshot.data, 'base64'))
}

async function addGame(name) {
  await evaluate(`(() => {
    const input = document.querySelector('.search-box input')
    if (!input) return false
    input.focus()
    input.select()
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, ${JSON.stringify(name)})
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
  await waitFor(
    `document.querySelectorAll('.search-result').length > 0`,
    `search results for ${name}`,
  )
  await sleep(250)
  await evaluate(`(() => {
    const input = document.querySelector('.search-box input')
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
    }))
    return true
  })()`)
  await sleep(500)
}

async function openPage(label) {
  await evaluate(`(() => {
    const button = [...document.querySelectorAll('.nav-item')]
      .find((node) => node.textContent.includes(${JSON.stringify(label)}))
    if (button) button.click()
    return Boolean(button)
  })()`)
}

function captureFailure() {
  if (!output.length) return ''
  return output.join('').split('\n').slice(-30).join('\n')
}

try {
  const wsUrl = await waitForTarget()
  const socket = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  cdp = new CdpClient(socket)

  await cdp.send('Runtime.enable')
  await cdp.send('Page.enable')
  await waitFor(`Boolean(document.querySelector('.search-box input'))`, 'the quest board')

  assert(
    (await evaluate(`document.querySelectorAll('.game-row').length`)) === 0,
    'The isolated test profile should start with an empty library.',
  )

  await addGame('fortnite')
  await waitFor(
    `[...document.querySelectorAll('.game-row')].some((node) => node.textContent.includes('Fortnite'))`,
    'Fortnite in the library',
  )

  await addGame('valorant')
  await waitFor(
    `[...document.querySelectorAll('.game-row')].some((node) => node.textContent.includes('VALORANT'))`,
    'VALORANT in the library',
  )

  await evaluate(`(() => {
    const row = [...document.querySelectorAll('.game-row')]
      .find((node) => node.textContent.includes('Fortnite'))
    if (row) row.click()
    return Boolean(row)
  })()`)
  await waitFor(
    `document.querySelector('.game-head h2')?.textContent?.includes('Fortnite')`,
    'the Fortnite detail panel',
  )

  await evaluate(`document.querySelector('.primary-actions .btn-primary')?.click()`)
  await waitFor(
    `document.querySelectorAll('.session-card').length > 0`,
    'a live game session',
    20_000,
  )

  const runningName = await evaluate(
    `document.querySelector('.session-card .session-copy strong')?.textContent?.trim()`,
  )
  assert(runningName === 'Fortnite', `Unexpected live session: ${runningName}`)

  await waitFor(
    `document.querySelectorAll('.toast').length === 0`,
    'notifications to clear',
    8_000,
  )
  await sleep(500)
  await capture('session')

  await evaluate(`document.querySelector('.session-card .session-stop')?.click()`)
  await waitFor(
    `document.querySelectorAll('.session-card').length === 0`,
    'the session to stop',
    15_000,
  )

  await openPage('Activity')
  await waitFor(`Boolean(document.querySelector('.activity-page'))`, 'the activity page')
  const logCount = await evaluate(`document.querySelectorAll('.log-row').length`)
  assert(logCount > 0, 'The activity log should contain events.')
  await sleep(400)
  await capture('activity')

  await openPage('Settings')
  await waitFor(`Boolean(document.querySelector('.settings-page'))`, 'the settings page')
  await capture('settings')

  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.theme-card')]
      .find((node) => node.textContent.includes('Light'))
    if (card) card.click()
    return Boolean(card)
  })()`)
  await waitFor(
    `document.documentElement.dataset.theme === 'light'`,
    'the light theme to apply',
  )
  await capture('light')

  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.theme-card')]
      .find((node) => node.textContent.includes('Dark'))
    if (card) card.click()
    return Boolean(card)
  })()`)
  await waitFor(
    `document.documentElement.dataset.theme === 'dark'`,
    'the dark theme to apply',
  )

  await openPage('Quest board')
  await waitFor(`Boolean(document.querySelector('.board-page'))`, 'the quest board again')
  await sleep(600)

  console.log('UI smoke test passed.')
  console.log(`  Added games: Fortnite, VALORANT`)
  console.log(`  Session:    ${runningName}`)
  console.log(`  Log rows:   ${logCount}`)
  console.log(`  Screenshots: ${screenshotDirectory}`)

  cdp.send('Browser.close').catch(() => undefined)
  await sleep(1200)
} catch (error) {
  console.error('UI smoke test failed.')
  console.error(error instanceof Error ? error.message : error)
  console.error(captureFailure())
  process.exitCode = 1
} finally {
  if (cdp) {
    try {
      cdp.close()
    } catch {
      // Already closed.
    }
  }

  const exited = await Promise.race([
    new Promise((resolve) => child.once('exit', () => resolve(true))),
    sleep(1500).then(() => false),
  ])
  if (!exited) child.kill()

  await fs.rm(profile, { recursive: true, force: true }).catch(() => undefined)
}
