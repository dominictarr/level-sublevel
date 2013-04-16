var Sublevel = require('../')

require('tape')('sublevel', function (t) {

  require('rimraf').sync('/tmp/test-sublevel')

  var base = Sublevel(require('levelup')('/tmp/test-sublevel'))

  Sublevel(base, '~')

  var a   = base.sublevel('A')
  var b   = base.sublevel('B')

  var as = {}
  var aas = {}

  a.pre(function (op, add) {
    as[op.key] = op.value
    console.log('A   :', op)
    add({
      key: op.key, value: op.value, 
      type: 'put', prefix: b//.prefix()
    }, b)
  })

  var val = 'random_' + Math.random()
  a.put('foo', val, function () {

    b.get('foo', function (err, _val) {
      t.equal(_val, val)
      t.end()
    })
  })
})
