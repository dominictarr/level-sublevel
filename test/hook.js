
var Mem = require('../')

var base = Mem()
var a    = base.namespace('A')
var b    = base.namespace('SEQ')
var c    = base.namespace('___')
var _a   = base.namespace('_A')
var i = 0

a.pre(function (ch, add) {
  add({key: i++, value: ch.key}, b)
})

b.pre(function (ch, add) {
  add({key: i++, value: ch.key}, c)
})

a.put('a', Math.random(), function () {
  console.log(base.store)
})

a.put('b', Math.random(), function () {
  console.log(base.store)
})

a.put('c', Math.random(), function () {
  console.log(base.store)
})


