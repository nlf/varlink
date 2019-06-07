const joi = require('joi')

const parser = require('./parser')

class VarlinkInterface {
  constructor (connection, description) {
    this.connection = connection
    this.description = description

    this.methods = {}
    this.types = {}
    this.errors = {}

    const parsed = parser.parse(description)
    this.name = parsed.name
    this.doc = parsed.doc

    for (const m of parsed.methods) {
      this._addMethod(m)
    }

    for (const t of parsed.typedefs) {
      this._addType(t)
    }

    for (const e of parsed.errors) {
      this._addError(e)
    }
  }

  _addMethod (m) {
    const gen = `return function ${m.name} (parameters, options) {
      return this.connection._call('${this.name}', '${m.name}', parameters, options)
    }`

    this[m.name] = Function(gen)()
  }

  _addType (t) {
    const gen = `return class ${t.name} {
      constructor (init) {
        ${t.members.map(p => `this.${p.name} = init.${p.name}`).join('\n')}
      }
    }`

    this[t.name] = Function(gen)()
  }

  _addError (e) {
    const gen = `return class ${e.name} extends Error {
        constructor (init) {
          super('${e.name}')
          ${e.parameters.map(p => `this.${p.name} = init.${p.name}`).join('\n')}
        }
      }
    `
    this[e.name] = Function(gen)()
  }
}

module.exports = VarlinkInterface
