var EventEmitter = require('events').EventEmitter
var inherits     = require('util').inherits
var ranges       = require('string-range')
var fixRange     = require('level-fix-range')

inherits(SubDB, EventEmitter)

function SubDB (db, prefix, sep) {
  if(!(this instanceof SubDB)) return new SubDB(db, prefix, sep)
  if(!db)     throw new Error('must provide db')
  if(!prefix) throw new Error('must provide prefix')
  
  this._parent = db
  this._sep = sep || '\xff'
  this._prefix = prefix
  this._root = root(this)
  var self = this
  this.hooks = {
    pre: function () {
      return self.pre.apply(self, arguments)
    },
    post: function () {
      return self.post.apply(self, arguments)
    }
  }
}

var SDB = SubDB.prototype

SDB._key = function (key) {
  return this._sep 
    + this._prefix 
    + this._sep
    + key
}

SDB.sublevel = function (prefix) {
  return new SubDB(this, prefix, this._sep)
}

SDB.put = function (key, value, opts, cb) {
  this._root.put(this.prefix(key), value, opts, cb)
//  this._parent.put(this._key(key), value, opts, cb)
}

SDB.get = function (key, opts, cb) {
  this._root.get(this.prefix(key), opts, cb)
//  this._parent.get(this._key(key), opts, cb)
}

SDB.del = function (key, opts, cb) {
  this._root.del(this.prefix(key), opts, cb)
//  this._parent.del(this._key(key), opts, cb)
}

SDB.batch = function (changes, opts, cb) {
  var self = this
  changes.forEach(function (ch) {
    ch.key = (ch.prefix || self).prefix(ch.key)
    if(ch.prefix) ch.prefix = null
  })
  this._root.batch(changes, opts, cb)
}

SDB.prefix = function (key) {
  return this._parent.prefix() + this._sep + this._prefix + this._sep + (key || '')
}

SDB.createKeyStream = function (opts) {
  opts = opts || {}
  opts.keys = true
  return this.createReadStream(opts)
}

SDB.createValueStream = function (opts) {
  opts = opts || {}
  opts.keys = true
  return this.createReadStream(opts)
}

SDB.createReadStream = function (opts) {
  opts = opts || {}
  var r = root(this)
  var p = this.prefix()
  //opts.start = p + (opts.start || '')
  //opts.end = p + (opts.end || this._sep)
  opts = ranges.prefix(opts, p)

  return r.createReadStream(opts)
    .on('data', function (d) {
      //mutate the prefix!
      //this doesn't work for createKeyStream admittedly.
      if(d.key)
        d.key = d.key.substring(p.length)
    })
}


SDB.createWriteStream = function () {
  var r = root(this)
  var p = this.prefix()
  var ws = r.createWriteStream.apply(r, arguments)
  var write = ws.write
  ws.write = function (data) {
    data.key = p + data.key
    return write.call(ws, data)
  }
  return ws
}

SDB.approximateSize = function () {
  var r = root(db)
  return r.approximateSize.apply(r, arguments)
}

function root(db) {
  if(!db._parent) return db
  return root(db._parent)
}

SDB.pre = function (range, hook) {
  if(!hook) hook = range, range = null
  range = ranges.prefix(range, this.prefix(), this._sep)
  var r = root(this._parent)
  var p = this.prefix()
  return r.hooks.pre(fixRange(range), function (ch, add) {
    hook({
      key: ch.key.substring(p.length),
      value: ch.value,
      type: ch.type
    }, function (ch, _p) {
      add(ch, _p || p)
    })
  })
}

SDB.post = function (range, hook) {
  if(!hook) hook = range, range = null
  var r = root(this._parent)
  var p = this.prefix()
  range = ranges.prefix(range, p, this._sep)
  return r.hooks.post(fixRange(range), function (data) {
    hook({key: data.key.substring(p.length), value: data.value, type: data.type})
  })
}

var exports = module.exports = SubDB

