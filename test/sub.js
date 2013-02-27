
var Mem = require('../mem')
var Sub = require('../')

var base = Mem()
var a    = Sub(base, 'A')
var b    = Sub(base, 'B')
var _a    = Sub(a, '_A')

a.put('a', Math.random(), function () {
  b.put('b', Math.random(), function () {
    _a.put('c', Math.random(), function () {
     console.log(base.store)
    })
  })
})


