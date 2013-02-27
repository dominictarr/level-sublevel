
var Mem = require('../')

var base = Mem()
var a    = base.namespace('A')
var b    = base.namespace('B')
var _a   = a.namespace('_A')

a.put('a', Math.random(), function () {
  b.put('b', Math.random(), function () {
    _a.put('c', Math.random(), function () {
     console.log(base.store)
    })
  })
})


