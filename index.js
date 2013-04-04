var EventEmitter = require('events').EventEmitter
var next         = process.nextTick
var SubDb        = require('./sub')
var fixRange     = require('level-fix-range')

var Hooks   = require('level-hooks')

module.exports   = function (db, sep) {
  //use \xff (255) as the seperator,
  //so that sections of the database will sort after the regular keys
  sep = sep || '\xff'

  Hooks(db)

  db.sublevel = function (prefix) {
    return new SubDb(db, prefix, sep)
  }

  db.prefix = function (key) {
    return '' + (key || '')
  }

  db.pre = function (range, hook) {
    if(!hook)
      hook = range, range = {
        max  : sep
      }
    return db.hooks.pre(range, hook)
  }

  db.post = function (range, hook) {
    if(!hook)
      hook = range, range = {
        max : sep
      }
    return db.hooks.post(range, hook)
  }

  function safeRange(fun) {
    return function (opts) {
      opts = opts || {}
      if((!opts.end && !opts.start) || (!opts.min && !opts.max))
        opts.max = sep
      fixRange(opts)
      console.log(opts)
      return fun.call(db, opts)
    }
  }

  db.createReadStream  = safeRange(db.createReadStream)
  db.createKeyStream   = safeRange(db.createKeyStream)
  db.createValueStream = safeRange(db.createValueStream)
  
  var batch = db.batch
  db.batch = function (changes, opts, cb) {
    changes.forEach(function (e) {
      if(e.prefix) {
        if(e.prefix && 'function' === typeof e.prefix.prefix)
          e.key = e.prefix.prefix(e.key)
      }
    })
    batch.call(db, changes, opts, cb)
  }
  return db
}

