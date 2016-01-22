"use strict";


var nut   = require('./nut')
var shell = require('./shell') //the shell surrounds the nut
var precodec = require('./codec')
var Codec = require('level-codec')
var merge = require('xtend')
var IteratorStream = require('level-iterator-stream')

var sublevel = function (db, opts) {
  opts = merge(db.options, opts)
  var codec = new Codec(opts)
  return shell ( nut ( db, precodec, codec ), [], IteratorStream, opts)
}

module.exports = function (db, opts) {
  if (typeof db.sublevel === 'function' && typeof db.clone === 'function') return db.clone(opts)
  return sublevel(db, opts)
}
