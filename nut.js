var hooks = require('./hooks')

module.exports = function (db, codec) {
  var prehooks = hooks()
  var posthooks = hooks()

  return {
    apply: function (ops, opts, cb) {
      //apply prehooks here.
      for(var i = 0; i < ops.length; i++) {
        var op = ops[i]
        prehooks.trigger([op.prefix, op.key], [op, add, ops])

        function add(ch) {
          if(ch === false) return delete ops[i]
          ops.push(ch)
        }
      }

      if(ops.length)
        db.batch(ops.map(function (op) {
          return {key: codec.encode([op.prefix, op.key]), value: op.value, type: op.value ? 'put' : 'del'}
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
    get: function (key, prefix, cb) {
      return db.get(codec.encode([prefix, key]), cb)
    },
    pre: prehooks.add,
    post: posthooks.add,
    iterator: function (opts) {
      var prefix = opts.prefix || []
      if(opts.lte) opts.lte = codec.encode([prefix, opts.lte])
      else         opts.lt  = codec.encode([prefix, opts.lt || '~'])
      if(opts.gt)  opts.gt  = codec.encode([prefix, opts.gt])
      else         opts.gte = codec.encode([prefix, opts.gte || ''])

      opts.prefix = null
      opts.keyAsBuffer = opts.valueAsBuffer = false
      var _db = db.db || db
      var iterator = _db.iterator (opts)
      return {
        next: function (cb) {
          return iterator.next(function (err, key, value) {
            if(err) return cb(err)
            console.log(key)
            cb(null, key && codec.decode(key)[1], value)
          })
        },
        end: iterator.end
      }
    }
  }

}
