var EventEmitter = require('events').EventEmitter

var sublevel = module.exports = function (nut, prefix, createStream) {
  var emitter = new EventEmitter()
  emitter.sublevels = {}
  prefix = prefix || []
  createStream = createStream || function (e) { return e }
  emitter.put = function (key, value, opts, cb) {
    if('function' === typeof opts) cb = opts, opts = {}

    nut.apply([{
      key: key, value: value, 
      prefix: prefix.slice(), type: 'put'
    }], opts, function (err) {
      if(err) return cb(err)
      emitter.emit('put', key, value); cb(null)
    })
  }

  emitter.del = function (key, opts, cb) {
    if('function' === typeof opts) cb = opts, opts = {}

    nut.apply([{
      key: key,
      prefix: prefix.slice(), type: 'del'
    }], opts, function (err) {
      if(err) return cb(err)
      emitter.emit('del', key); cb(null)
    })
  }

  emitter.batch = function (ops, opts, cb) {
    if('function' === typeof opts) 
      cb = opts, opts = {}
    ops = ops.map(function (op) {
      return {
        key:           op.key,   
        value:         op.value,
        prefix:        op.prefix || prefix,
        keyEncoding:   op.keyEncoding,    // *
        valueEncoding: op.valueEncoding,  // * (TODO: encodings on sublevel)
      }
    })
    nut.apply(ops, opts, function (err) {
      if(err) return cb(err)
      emitter.emit('batch', ops); cb(null)
    })
  }

  emitter.get = function (key, cb) {
    if('function' === typeof opts) 
      cb = opts, opts = {}
    nut.get(key, prefix, cb)
  }

  emitter.sublevel = function (name) {
    return emitter.sublevels[name] =
      emitter.sublevels[name] || sublevel(nut, prefix.concat(name), createStream)
  }

  emitter.pre = function (key, hook) {
    if('function' === typeof key) return nut.pre([prefix], key)
    if('string'   === typeof key) return nut.pre([prefix, key], hook)
    //TODO: {lt, lte, gt, gte}
    throw new Error('not implemented')
  }

  emitter.post = function (key, hook) {
    if('function' === typeof key) return nut.post([prefix], key)
    if('string'   === typeof key) return nut.post([prefix, key], hook)

    //TODO: handle ranges, needed for level-live-stream, etc.
    throw new Error('not implemented')
  }

  emitter.createReadStream = function (opts) {
    opts = opts || {}
    opts.prefix = prefix
    return createStream(nut.iterator(opts), opts)
  }

  return emitter
}
