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
          return {key: codec.encode([op.prefix, op.key]), value: op.value}
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
    post: posthooks.add
  }

}
