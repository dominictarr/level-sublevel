

var nut   = require('./nut')
var shell = require('./shell') //the shell surrounds the nut
var precodec = require('./codec')
var codec = require('levelup/lib/codec')
var merge = require('xtend')

var ReadStream = require('levelup/lib/read-stream')

module.exports = function (db, opts) {
  opts = merge(db.options, opts)
  return shell ( nut ( db, precodec, codec ), [], ReadStream, opts)
}
