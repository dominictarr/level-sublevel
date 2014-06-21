var hooks = require('./hooks')

function isFunction (f) {
  return 'function' === typeof f
}

function getPrefix (db) {
  if(db == null) return db
  if(isFunction(db.prefix)) return db.prefix()
  return db
}

module.exports = function (db, precodec, codec) {
  var prehooks = hooks()
  var posthooks = hooks()
  var waiting = [], ready = false

  function encodePrefix(prefix, key, opts1, opts2) {
    return precodec.encode([ prefix, codec.encodeKey(key, opts1, opts2) ])
  }

  function decodePrefix(data) {
    return precodec.decode(data)
  }

  function start () {
    ready = true
    while(waiting.length)
      waiting.shift()()
  }

  if(isFunction(db.isOpen)) {
    if(db.isOpen())
      ready = true
    else
      db.open()
  } else {
    db.open(start)
  }

  return {
    apply: function (ops, opts, cb) {
      //apply prehooks here.
      for(var i = 0; i < ops.length; i++) {
        var op = ops[i]
        op.prefix = getPrefix(op.prefix)
        prehooks.trigger([op.prefix, op.key], [op, add, ops])

        function add(ch) {
          if(ch === false) return delete ops[i]
          ops.push(ch)
        }
      }

      if(ops.length)
        db.batch(ops.map(function (op) {
          return {
            key: encodePrefix(op.prefix, op.key, opts, op),
            value: codec.encodeValue(op.value, opts, op),
            type: op.value ? 'put' : 'del'
          }
        }), opts, function (err) {
          if(err) return cb(err)
          ops.forEach(function (op) {
            posthooks.trigger([op.prefix, op.key], op)
          })
          cb()
        })
      else
        cb()
    },
    get: function (key, prefix, opts, cb) {
      return db.get(encodePrefix(prefix, key, opts), cb)
    },
    pre: prehooks.add,
    post: posthooks.add,
    createDecoder: function (opts) {
      if(opts.keys !== false && opts.values !== false)
        return function (key, value) {
          return {
            key: codec.decodeKey(key, opts),
            value: codec.decodeValue(value, opts)
          }
        }
      if(opts.values !== false)
        return function (_, value) {
          return codec.decode(value, opts)
        }
      if(opts.keys !== false)
        return function (key) {
          return codec.decodeKey(precodec.decode(key)[1], opts)
        }
      return function () {}
    },
    iterator: function (opts, cb) {
      var prefix = opts.prefix || []
      if(opts.lte) opts.lte = encodeKey(prefix, opts.lte)
      else         opts.lt  = precodec.encode([prefix, opts.lt || '~'])
      if(opts.gt)  opts.gt  = precodec.encode([prefix, opts.gt])
      else         opts.gte = precodec.encode([prefix, opts.gte || ''])

      opts.prefix = null

      //************************************************
      //hard coded defaults, for now...
      //TODO: pull defaults and encoding out of levelup.
      opts.keyAsBuffer = opts.valueAsBuffer = false
      //************************************************

      opts.keyAsBuffer = precodec.buffer
      opts.valueAsBuffer = codec.isValueAsBuffer(opts)

      var _db = db.db || db

      var iterator = _db.iterator (opts)
      return {
        next: function (cb) {
          return iterator.next(function (err, key, value) {
            if(err) return cb(err)
            if(key) {
              key = decodePrefix(key)
              key = codec.decodeKey(key[1], opts)
            }
            if(value)
              value = codec.decodeValue(value, opts)
            cb(null, key, value)
          })
        },
        end: iterator.end
      }
    }
  }

}
