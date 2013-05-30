var Sublevel = require('../')
var level = require('level-test')()

require('tape')('insert in prehook', function (t) {

  var base = Sublevel(level('test-sublevel'))

  Sublevel(base, { sep: '~' })

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

  var base = Sublevel(level('test-sublevel2'))

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


