
var EventEmitter = require('events').EventEmitter
var next = process.nextTick
var SubDb = require('./sub')

module.exports = function () {

  var store = {}
  var emitter = new EventEmitter()

  emitter.namespace = function (prefix) {
    return new SubDb(emitter, prefix)
  }

  emitter.put = function (key, value, opts, cb) {
    if(!cb) cb = opts, opts = null
    emitter._change(
      [{type: 'put', key: key, value: value}]
    , cb)
  }

  emitter.del = function (key, value, opts, cb) {
    if(!cb) cb = opts, opts = null
    emitter._change(
      [{type: 'del', key: key, value: value}]
    , cb)
  }

  emitter._change = function (ch, cb) {
    console.log(ch)
    ch = emitter._hook(ch)
    next(function () {
      ch.forEach(function (e) {
        if(e.type == 'del') delete store[e.key]
        else                store[e.key] = e.value
      })
      if(ch.length == 1)
        emitter.emit(ch[0].type, ch[0].key, ch[0].value)
      else
        emitter.emit('batch', ch)
      cb()
    })
  }

  emitter.batch = function (changes, opts, cb) {
    if(!cb) cb = opts, opts = null
    emitter._change(changes, cb)
    return emitter
  }

  emitter.store = store

  emitter._hook = function (batch) {
    if(!Array.isArray(batch))
      batch = [batch]
    var hooks = this._hooks || []
    function hook(e, i) {
      hooks.forEach(function (h) {
        console.log('hook', e, h.prefix)
          if(e.key.indexOf(h.prefix) == 0)
            h.hook(e, function (ch, db) {
              if(ch === false) {
                return delete batch[i]
              }
              ch.key = (db ? db.prefix() : h.prefix) + ch.key
              console.log('batch - add', batch, ch)
              var j = batch.push(ch)
              hook(ch, batch.length - 1)
              
            })
      })
    }

    batch.forEach(hook)
    return batch
  }

  emitter._pre = function (prefix, hook) {
    this._hooks = this._hooks || []
    this._hooks.push({prefix: prefix, hook: hook})
    console.log("_HOOKS", this._hooks)
  }

  emitter.pre = function (hook) {
    emitter._pre('', hook)
  }

  emitter.prefix = function () {
    return ''
  }

  return emitter
}

