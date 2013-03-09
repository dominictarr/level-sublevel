var Hooks  = require('level-hooks')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

inherits(SubDB, EventEmitter)

function SubDB (db, prefix, sep) {
  if(!(this instanceof SubDB)) return new SubDB(db, prefix)
  if(!db)     throw new Error('must provide db')
  if(!prefix) throw new Error('must provide prefix')

  Hooks(db)

  this._parent = db
  this._sep = sep || '\xff'
  this._prefix = prefix
  this._root = root(this)
  var self = this
  this.hooks = {
    pre: function () {
      self.pre.apply(self, arguments)
    },
    post: function () {
      self.pre.apply(self, arguments)
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
  opts.start = p + (opts.start || '')
  opts.end = p + (opts.end || this._sep)
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

SDB.pre = function (hook) {
  var r = root(this._parent)
  var p = this.prefix()

  r.hooks.pre({
    start: p,
    end  : p + this._sep
  }
  , function (ch, add) {
    hook({
      key: ch.key.substring(p.length),
      value: ch.value,
      type: ch.type
    }, function (ch, _p) {
      add(ch, _p || p)
    })
  })
  return this
}

SDB.post = function (hook) {
  var r = root(this._parent)
  var p = this.prefix()
  r.hooks.post({
    start: p,
    end  : p + this._sep
  }
  , function (data) {
    hook({key: data.key.substring(p.length), value: data.value, type: data.type})
  })
  return this
}

var exports = module.exports = SubDB

