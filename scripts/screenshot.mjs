import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const electronBin = path.join(
  root,
  'node_modules',
  'electron',
  'dist',
  process.platform === 'win32' ? 'electron.exe' : 'electron',
)
const output = path.join(root, 'screenshots', 'questline.png')
await fs.mkdir(path.dirname(output), { recursive: true })

const child = spawn(electronBin, ['.'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    QC_SCREENSHOT: output,
    QC_SCREENSHOT_DELAY: '3500',
  },
})

child.on('exit', (code) => process.exit(code ?? 0))
