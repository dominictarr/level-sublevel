var EventEmitter = require('events').EventEmitter

var sublevel = module.exports = function (nut, prefix) {

  var emitter = new EventEmitter()
  emitter.sublevels = {}
  prefix = prefix || []

  emitter.put = function (key, value, opts, cb) {
    if('function' === typeof opts) cb = opts, opts = {}

    nut.apply([{
      key: key, value: value, 
      prefix: prefix.slice(), type: 'put'
    }], opts, cb)
  }

  emitter.del = function (key, opts, cb) {
    if('function' === typeof opts) cb = opts, opts = {}

    nut.apply([{
      key: key,
      prefix: prefix.slice(), type: 'del'
    }], opts, cb)
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
    nut.apply(ops, opts, cb)
  }

  emitter.get = function (key, cb) {
    if('function' === typeof opts) 
      cb = opts, opts = {}
    nut.get(key, prefix, cb)
  }

  emitter.sublevel = function (name) {
    return emitter.sublevels[name] =
      emitter.sublevels[name] || sublevel(nut, prefix.concat(name))
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
    //TODO: {lt, lte, gt, gte}
    throw new Error('not implemented')
  }

  return emitter
}
