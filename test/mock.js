var EventEmitter = require('events').EventEmitter

module.exports = function () {
  var emitter = new EventEmitter()
  var data = emitter.data = {}

  emitter.batch = function (ops, opts, cb) {
    ops.forEach(function (op) {
      if(op.type === 'del')
        delete data[op.key]
      else
        data[op.key] = op.value
    })
    setImmediate(function () {
      emitter.emit('post', ops); cb()
    })
  }

  emitter.get = function (key, cb) {
    console.log('GET', key, data)
    var value = data[key]
    setImmediate(function () {
      if(!value) cb(new Error('404'))
      else       cb(null, value)
    })
  }

  return emitter
}

