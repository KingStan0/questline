import crypto from 'node:crypto'
import net from 'node:net'
import path from 'node:path'

const OP_HANDSHAKE = 0
const OP_FRAME = 1
const OP_CLOSE = 2
const OP_PING = 3
const OP_PONG = 4

function encodeFrame(opcode, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8')
  const header = Buffer.alloc(8)
  header.writeUInt32LE(opcode, 0)
  header.writeUInt32LE(body.length, 4)
  return Buffer.concat([header, body])
}

function pipeCandidates() {
  if (process.platform === 'win32') {
    return Array.from({ length: 10 }, (_, index) => `\\\\.\\pipe\\discord-ipc-${index}`)
  }

  const runtime = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || '/tmp'
  const base = path.join(runtime, 'discord-ipc')
  return Array.from({ length: 10 }, (_, index) => `${base}-${index}`)
}

class DiscordRpcClient {
  constructor() {
    this.socket = null
    this.buffer = Buffer.alloc(0)
    this.pending = new Map()
    this.ready = false
    this.appId = null
    this.since = null
  }

  get connected() {
    return Boolean(this.socket && !this.socket.destroyed && this.ready)
  }

  async connect(appId) {
    await this.disconnect(false)

    const errors = []

    for (const pipe of pipeCandidates()) {
      try {
        await this.openPipe(pipe)
        await this.handshake(appId)
        this.appId = String(appId)
        this.since = Date.now()
        this.ready = true
        return
      } catch (error) {
        errors.push(error.message)
        this.destroySocket()
      }
    }

    throw new Error(
      'Could not reach Discord. Make sure the Discord desktop app is running and try again.',
    )
  }

  openPipe(pipe) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(pipe)
      const timer = setTimeout(() => {
        socket.destroy()
        reject(new Error('Discord IPC connection timed out.'))
      }, 1500)

      socket.once('connect', () => {
        clearTimeout(timer)
        this.socket = socket
        this.buffer = Buffer.alloc(0)
        this.attachSocket(socket)
        resolve()
      })

      socket.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
    })
  }

  attachSocket(socket) {
    socket.on('data', (chunk) => this.onData(chunk))
    socket.on('error', () => {
      this.ready = false
    })
    socket.on('close', () => {
      this.ready = false
      for (const request of this.pending.values()) {
        request.reject(new Error('The Discord IPC connection closed.'))
      }
      this.pending.clear()
    })
  }

  async handshake(appId) {
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Discord did not finish the handshake.')),
        5000,
      )
      this.handshakeWaiter = { resolve, reject, timer }
    })

    this.write(OP_HANDSHAKE, { v: 1, client_id: String(appId) })
    await response
  }

  onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])

    while (this.buffer.length >= 8) {
      const opcode = this.buffer.readUInt32LE(0)
      const length = this.buffer.readUInt32LE(4)
      if (this.buffer.length < 8 + length) break

      const raw = this.buffer.subarray(8, 8 + length).toString('utf8')
      this.buffer = this.buffer.subarray(8 + length)

      let message = null
      try {
        message = raw ? JSON.parse(raw) : null
      } catch {
        continue
      }

      if (opcode === OP_PING) {
        this.write(OP_PONG, message ?? {})
        continue
      }

      if (opcode === OP_CLOSE) {
        this.ready = false
        this.destroySocket()
        continue
      }

      if (opcode !== OP_FRAME || !message) continue

      if (message.evt === 'READY' && this.handshakeWaiter) {
        clearTimeout(this.handshakeWaiter.timer)
        this.handshakeWaiter.resolve()
        this.handshakeWaiter = null
        continue
      }

      if (message.nonce && this.pending.has(message.nonce)) {
        const request = this.pending.get(message.nonce)
        clearTimeout(request.timer)
        this.pending.delete(message.nonce)
        if (message.evt === 'ERROR') {
          request.reject(
            new Error(message.data?.message || 'Discord rejected the request.'),
          )
        } else {
          request.resolve(message.data)
        }
      }
    }
  }

  write(opcode, payload) {
    if (!this.socket || this.socket.destroyed) {
      throw new Error('The Discord IPC socket is not connected.')
    }
    this.socket.write(encodeFrame(opcode, payload))
  }

  request(command, args) {
    if (!this.connected) {
      throw new Error('Discord RPC is not connected.')
    }

    const nonce = crypto.randomUUID()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(nonce)
        reject(new Error('Discord did not answer the request.'))
      }, 8000)

      this.pending.set(nonce, { resolve, reject, timer })
      this.write(OP_FRAME, { cmd: command, args, nonce })
    })
  }

  async setActivity({ name }) {
    await this.request('SET_ACTIVITY', {
      pid: process.pid,
      activity: {
        details: `Playing ${name}`,
        state: 'Quest session via Questline',
        timestamps: { start: Date.now() },
        instance: false,
      },
    })
  }

  async clearActivity() {
    if (!this.connected) return
    try {
      await this.request('SET_ACTIVITY', { pid: process.pid, activity: null })
    } catch {
      // Closing the connection below clears presence anyway.
    }
  }

  async disconnect(clear = true) {
    if (clear && this.connected) {
      await this.clearActivity()
    }

    if (this.handshakeWaiter) {
      clearTimeout(this.handshakeWaiter.timer)
      this.handshakeWaiter.reject(new Error('Disconnected.'))
      this.handshakeWaiter = null
    }

    for (const request of this.pending.values()) {
      clearTimeout(request.timer)
      request.reject(new Error('Disconnected.'))
    }
    this.pending.clear()

    this.destroySocket()
    this.ready = false
    this.appId = null
    this.since = null
  }

  destroySocket() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.destroy()
      this.socket = null
    }
    this.buffer = Buffer.alloc(0)
  }

  status() {
    return {
      connected: this.connected,
      appId: this.connected ? this.appId : null,
      since: this.connected ? this.since : null,
    }
  }
}

export const discordRpc = new DiscordRpcClient()
