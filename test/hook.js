
var Mem = require('../mem')
var Sub = require('../')

var base = Mem()
var a    = Sub(base, 'A')
var b    = Sub(base, 'SEQ')
var c    = Sub(base, '___')
var _a    = Sub(a, '_A')
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


