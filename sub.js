var Hooks  = require('level-hooks')

function SubDB (db, prefix, sep) {
  if(!(this instanceof SubDB)) return new SubDB(db, prefix)
  if(!db)     throw new Error('must provide db')
  if(!prefix) throw new Error('must provide prefix')

  Hooks(db)

  this._parent = db
  this._sep = sep || '\xff'
  this._prefix = prefix
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
  var s = this._prefix + this._sep + key
  if(!this._parent._parent)
    return this._sep + s
  return s
}

SDB.sublevel = function (prefix) {
  return new SubDB(this, prefix)
}

SDB.put = function (key, value, opts, cb) {
  //prehook
  this._parent.put(this._key(key), value, opts, cb)
}

SDB.get = function (key, opts, cb) {
  this._parent.get(this._key(key), opts, cb)
}

SDB.del = function (key, opts, cb) {
  this._parent.del(this._key(key), opts, cb)
}

SDB.batch = function (changes, opts, cb) {
  var self = this
  changes.forEach(function (ch) {
    ch.key = self._key(ch.key)
  })
  this._parent.batch(changes, opts, cb)
}

SDB.prefix = function () {
  return this._parent.prefix() + this._sep + this._prefix + this._sep
}

;['createReadStream', 'createKeyStream', 'createValueStream']
  .forEach(function (createStream) {
    SDB[createStream] = function (opts) {
      var r = root(this)
      var p = this.prefix()
      opts = opts || {}
      opts.start = p + (opts.start || '')
      opts.end = p + (opts.end || this._sep)
      return r[createStream].call(r, opts)
        .on('data', function (d) {
          //mutate the prefix!
          d.key = d.key.replace(p, '')
        })
    }
  })

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
  r.hooks.pre({
    start: this.prefix(),
    end  : this.prefix() + this._sep
  }
  , hook)
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
    hook({key: data.key.replace(p, ''), value: data.value, type: data.type})
  })
  return this
}

var exports = module.exports = SubDB

