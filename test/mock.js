var EventEmitter = require('events').EventEmitter
var range = require('../range')
var pull = require('pull-stream')

var next = 'undefined' === typeof setImmediate ? setTimeout : setImmediate

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
    next(function () {
      emitter.emit('post', ops); cb()
    })
  }

  emitter.get = function (key, cb) {
    var value = data[key]
    next(function () {
      if(!value) cb(new Error('404'))
      else       cb(null, value)
    })
  }

  emitter.iterator = function (opts) {
    var values = Object.keys(data).sort().filter(function (v) {
      return range(opts, v)
    }).map(function (key) {
      return {key: key, value: data[key]}
    })
    if(opts.reverse) values.reverse()

    var stream = pull.values(values)

    return {
      get: function (cb) {
        stream(null, function (err, d) {
          cb(err, d && d.key, d && d.value)
        })
      },
      end: function (cb) {
        stream(true, cb)
      }
    }
  }

  return emitter
}

