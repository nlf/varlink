'use strict'

const { expect } = require('chai')

const Connection = require('../lib/connection')
const { Readable } = require('stream')

describe('org.varlink.certification Client', () => {
  let connection
  let certification
  let base
  let payload

  before(async () => {
    connection = new Connection({ host: '127.0.0.1', port: 12345 })
    await connection.connect()
    certification = connection.interfaces.get('org.varlink.certification')
  })

  after(() => {
    return connection.disconnect()
  })

  it('Start', async () => {
    const resp = await certification.Start()
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.client_id).to.be.a('string')
    base = { client_id: resp.parameters.client_id }
    payload = base
  })

  it('Test01', async () => {
    const resp = await certification.Test01(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.bool).to.be.a('boolean')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test02', async () => {
    const resp = await certification.Test02(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.int).to.be.a('number')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test03', async () => {
    const resp = await certification.Test03(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.float).to.be.a('number')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test04', async () => {
    const resp = await certification.Test04(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.string).to.be.a('string')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test05', async () => {
    const resp = await certification.Test05(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.bool).to.be.a('boolean')
    expect(resp.parameters.int).to.be.a('number')
    expect(resp.parameters.float).to.be.a('number')
    expect(resp.parameters.string).to.be.a('string')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test06', async () => {
    const resp = await certification.Test06(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.struct).to.be.an('object')
    expect(resp.parameters.struct.bool).to.be.a('boolean')
    expect(resp.parameters.struct.int).to.be.a('number')
    expect(resp.parameters.struct.float).to.be.a('number')
    expect(resp.parameters.struct.string).to.be.a('string')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test07', async () => {
    const resp = await certification.Test07(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.map).to.be.an('object')
    for (const key in resp.parameters.map) {
      expect(resp.parameters.map[key]).to.be.a('string')
    }
    payload = Object.assign(resp.parameters, base)
  })

  it('Test08', async () => {
    const resp = await certification.Test08(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.set).to.be.an('object')
    for (const key in resp.parameters.set) {
      expect(resp.parameters.set[key]).to.be.an('object')
    }
    payload = Object.assign(resp.parameters, base)
  })

  it('Test09', async () => {
    const resp = await certification.Test09(payload)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.mytype).to.be.an('object')
    payload = Object.assign(resp.parameters, base)
  })

  it('Test10', async () => {
    const resp = await certification.Test10(payload, { more: true })
    expect(resp).to.be.an.instanceof(Readable)
    const buffer = []
    resp.on('data', chunk => buffer.push(chunk))
    await new Promise(resolve => resp.once('end', resolve))
    payload = Object.assign({ last_more_replies: buffer.map(b => b.parameters.string) }, base)
  })

  it('Test11', async () => {
    const resp = await certification.Test11(payload, { oneway: true })
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.equal(null)
  })

  it('End', async () => {
    const resp = await certification.End(base)
    expect(resp).to.be.an('object')
    expect(resp.parameters).to.be.an('object')
    expect(resp.parameters.all_ok).to.equal(true)
  })
})
