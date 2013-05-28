var Sublevel = require('../')

require('tape')('insert in prehook', function (t) {

  require('rimraf').sync('/tmp/test-sublevel')

  var base = Sublevel(require('level')('/tmp/test-sublevel'))

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
      type: 'put', prefix: b.prefix()
    })
  })

  var val = 'random_' + Math.random()
  a.put('foo', val, function () {

    b.get('foo', function (err, _val) {
      t.equal(_val, val)
      t.end()
    })
  })

})

require('tape')('insert in prehook 2', function (t) {

  require('rimraf').sync('/tmp/test-sublevel2')

  var base = Sublevel(require('level')('/tmp/test-sublevel2'))

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
      type: 'put', prefix: b
    })
  })

  var val = 'random_' + Math.random()
  a.put('foo', val, function () {

    b.get('foo', function (err, _val) {
      t.equal(_val, val)
      t.end()
    })
  })

})


