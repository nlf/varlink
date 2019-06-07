'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

const { parser } = require('../')

const service = fs.readFileSync(path.resolve(__dirname, '../lib/services/org.varlink.certification.varlink'), { encoding: 'utf8' })
const result = parser.parse(service)
// console.log(util.inspect(result, false, null, true))
