'use strict'

const fs = require('fs')
const net = require('net')
const path = require('path')
const { PassThrough } = require('stream')

const VarlinkInterface = require('./interface')
const serviceInterface = fs.readFileSync(path.resolve(__dirname, './services/org.varlink.service.varlink'), { encoding: 'utf8' })

class VarlinkConnection {
  constructor (address) {
    this.address = address
    this.socket = new net.Socket()
    this.interfaces = new Map()

    this.socket.on('error', (err) => {
      if (this._reject) {
        return this._reject(err)
      }

      throw err
    })

    this.socket.on('data', (chunk) => {
      if (!this._stream && (!this._reject || !this._resolve)) {
        throw new Error('Received unexpected packet')
      }

      this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk
      let idx = this._buffer.indexOf(0x00)
      while (idx > -1) {
        const segment = this._buffer.slice(0, idx)
        this._buffer = this._buffer.slice(idx + 1)
        idx = this._buffer.indexOf(0x00)
        try {
          const parsed = JSON.parse(segment)

          if (parsed.hasOwnProperty('continues')) {
            this._stream = this._stream || new PassThrough({ objectMode: true })
            if (this._resolve) {
              this._resolve(this._stream)
            }

            if (parsed.continues === true) {
              this._stream.write(parsed)
            } else {
              this._stream.end(parsed)
            }

            this._resolve = null
            this._reject = null
          } else if (parsed.error) {
            const errName = parsed.error.slice(parsed.error.lastIndexOf('.') + 1)
            const ifaceName = parsed.error.slice(0, parsed.error.lastIndexOf('.'))
            const iface = this.interfaces.get(ifaceName)
            const err = new iface[errName](parsed.parameters)
            return this._reject(err)
          } else {
            return this._resolve(parsed)
          }
        } catch (err) {
          return this._reject(err)
        }
      }
    })
  }

  async connect () {
    await new Promise((resolve, reject) => {
      this._reject = reject
      this.socket.connect(this.address, () => {
        this._reject = null
        return resolve()
      })
    })

    this.interfaces.set('org.varlink.service', new VarlinkInterface(this, serviceInterface))
    const info = await this.call('org.varlink.service', 'GetInfo')
    this.vendor = info.parameters.vendor
    this.product = info.parameters.product
    this.version = info.parameters.version
    this.url = info.parameters.url
    for (const iface of info.parameters.interfaces) {
      if (iface === 'org.varlink.service') {
        continue
      }

      const resp = await this.call('org.varlink.service', 'GetInterfaceDescription', { interface: iface })
      this.interfaces.set(iface, new VarlinkInterface(this, resp.parameters.description))
    }
  }

  disconnect () {
    return new Promise((resolve, reject) => {
      this._reject = reject
      this.socket.end(() => {
        this._reject = null
        return resolve()
      })
    })
  }

  async call (ifaceName, method, parameters, options) {
    if (!this.interfaces.has(ifaceName)) {
      throw new Error(`Unknown interface: ${ifaceName}`)
    }

    const iface = this.interfaces.get(ifaceName)
    if (!iface[method]) {
      throw new Error(`Interface ${ifaceName} does not have a method ${method}`)
    }

    return iface[method](parameters, options)
  }

  async _call (ifaceName, method, parameters, { oneway, more } = {}) {
    const methodCall = {
      method: `${ifaceName}.${method}`,
      parameters,
      oneway,
      more
    }
    const payload = `${JSON.stringify(methodCall)}\0`

    await new Promise((resolve, reject) => {
      this._reject = reject
      this.socket.write(payload, () => {
        this._reject = null
        return resolve()
      })
    })

    if (oneway) {
      return { parameters: null }
    }

    const resp = await new Promise((resolve, reject) => {
      this._reject = reject
      this._resolve = resolve
    })

    return resp
  }
}

module.exports = VarlinkConnection
