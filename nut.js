var hooks = require('./hooks')

function isFunction (f) {
  return 'function' === typeof f
}

function getPrefix (db) {
  if(db == null) return db
  if(isFunction(db.prefix)) return db.prefix()
  return db
}

function has(obj, name) {
  return Object.hasOwnProperty.call(obj, name)
}

function clone (_obj) {
  var obj = {}
  for(var k in _obj)
    obj[k] = _obj[k]
  return obj
}

module.exports = function (db, precodec, codec) {
  var prehooks = hooks()
  var posthooks = hooks()
  var waiting = [], ready = false

  function encodePrefix(prefix, key, opts1, opts2) {
    return precodec.encode([ prefix, codec.encodeKey(key, opts1, opts2 ) ])
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
      db.open(start)
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

      opts = opts || {}

      if('object' !== typeof opts) throw new Error('opts must be object, was:'+ opts) 

      if('function' === typeof opts) cb = opts, opts = {}

      if(ops.length)
        (db.db || db).batch(
          ops.map(function (op) {
            return {
              key: encodePrefix(op.prefix, op.key, opts, op),
              value:
                  op.type !== 'del'
                ? codec.encodeValue(op.value, opts, op)
                : undefined,
              type:
                op.type || (op.value === undefined ? 'del' : 'put')
            }
          }),
          opts,
          function (err) {
              if(err) return cb(err)
            ops.forEach(function (op) {
              posthooks.trigger([op.prefix, op.key], [op])
            })
            cb()
          }
        )
      else
        cb()
    },
    get: function (key, prefix, opts, cb) {
      opts.asBuffer = codec.isValueAsBuffer(opts)
      return (db.db || db).get(
        encodePrefix(prefix, key, opts),
        opts,
        function (err, value) {
          if(err) cb(err)
          else    cb(null, codec.decodeValue(value, opts || options))
        }
      )
    },
    pre: prehooks.add,
    post: posthooks.add,
    createDecoder: function (opts) {
      if(opts.keys !== false && opts.values !== false)
        return function (key, value) {
          return {
            key: codec.decodeKey(precodec.decode(key)[1], opts),
            value: codec.decodeValue(value, opts)
          }
        }
      if(opts.values !== false)
        return function (_, value) {
          return codec.decodeValue(value, opts)
        }
      if(opts.keys !== false)
        return function (key) {
          return codec.decodeKey(precodec.decode(key)[1], opts)
        }
      return function () {}
    },
    iterator: function (_opts, cb) {
      var opts = clone(_opts || {})
      var prefix = opts.prefix || []


      function encodeKey(key) {
        return encodePrefix(prefix, key, opts, {})
      }
      var upper = precodec.upperBound
      var lower = precodec.lowerBound

      if(opts.start || opts.end) {
        if(opts.reverse) {
          opts.lte = encodeKey(opts.start || upper)
          opts.gte = encodeKey(opts.end   || lower)
        } else {
          opts.gte = encodeKey(opts.start || lower)
          opts.lte = encodeKey(opts.end   || upper)
        }
        delete opts.start
        delete opts.end
      } else {
        if(opts.min) opts.gte = opts.min
        if(opts.max) opts.lte = opts.max

        if(opts.lte)   opts.lte   = encodeKey(opts.lte)
        if(opts.lt)    opts.lt    = encodeKey(opts.lt)
        if(opts.gt)    opts.gt    = encodeKey(opts.gt)
        if(opts.gte)   opts.gte   = encodeKey(opts.gte)
      }

      if(!has(opts, 'lte') && !has(opts, 'lt'))
        opts.lte = encodeKey(upper)
      if(!has(opts, 'gte') && !has(opts, 'gt'))
        opts.gte = encodeKey(lower)

      opts.prefix = null

      //************************************************
      //hard coded defaults, for now...
      //TODO: pull defaults and encoding out of levelup.
      opts.keyAsBuffer = opts.valueAsBuffer = false
      //************************************************


      //this is vital, otherwise limit: undefined will
      //create an empty stream.
      if ('number' !== typeof opts.limit)
        opts.limit = -1

      opts.keyAsBuffer = precodec.buffer
      opts.valueAsBuffer = codec.isValueAsBuffer(opts)

      function wrapIterator (iterator) {
        return {
          next: function (cb) {
            return iterator.next(cb)
          },
          end: function (cb) {
            iterator.end(cb)
          }
        }
      }

      if(ready)
        return wrapIterator((db.db || db).iterator(opts))
      else
        waiting.push(function () {
          cb(null, wrapIterator((db.db || db).iterator(opts)))
        })

    }
  }

}
