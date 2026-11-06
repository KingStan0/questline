import { app, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const svgPath = path.join(root, 'public', 'logo.svg')
const outputDirectory = path.join(root, 'build')
const sizes = [16, 24, 32, 48, 64, 128, 256]

function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = []
  for (const image of images) {
    const entry = Buffer.alloc(16)
    entry[0] = image.size >= 256 ? 0 : image.size
    entry[1] = image.size >= 256 ? 0 : image.size
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(image.data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += image.data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

app.whenReady().then(async () => {
  try {
    await fs.mkdir(outputDirectory, { recursive: true })
    const svg = await fs.readFile(svgPath, 'utf8')
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    const html = `<!doctype html>
      <html>
        <body style="margin:0;background:transparent;overflow:hidden">
          <img src="${dataUrl}" style="display:block;width:512px;height:512px" />
        </body>
      </html>`

    const window = new BrowserWindow({
      width: 512,
      height: 512,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      webPreferences: {
        offscreen: true,
        backgroundThrottling: false,
      },
    })

    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    await new Promise((resolve) => setTimeout(resolve, 900))

    const capture = await window.webContents.capturePage()
    const base = capture.resize({ width: 512, height: 512, quality: 'best' })
    const pngBase = base.toPNG()
    await fs.writeFile(path.join(outputDirectory, 'icon.png'), pngBase)

    const images = sizes.map((size) => {
      const resized = base.resize({ width: size, height: size, quality: 'best' })
      return { size, data: resized.toPNG() }
    })

    await fs.writeFile(path.join(outputDirectory, 'icon.ico'), buildIco(images))
    console.log(`Wrote ${path.join(outputDirectory, 'icon.ico')}`)
    console.log(`Wrote ${path.join(outputDirectory, 'icon.png')}`)
    window.destroy()
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})

app.on('window-all-closed', () => {
  // The icon window is destroyed manually after the files are written.
})
