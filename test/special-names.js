var levelup = require('level-test')()

var base = require('../')(levelup('test-sublevels'))

var test = require('tape')

test('special names', function (t) {
  t.deepEqual(base.sublevels, {})

  var cons = base.sublevel('constructor')
  var proto = base.sublevel('__proto__')
  var toString = base.sublevel('toString')

  t.deepEqual(base.sublevels, {
    '$constructor': cons,
    '$__proto__': proto,
    '$toString': toString
  })
  t.deepEqual(cons.sublevels, {})

  t.strictEqual(base.sublevel('constructor'), cons)
  t.strictEqual(base.sublevel('__proto__'), proto)
  t.strictEqual(base.sublevel('toString'), toString)

  t.deepEqual(cons.prefix(), ['constructor'])
  t.deepEqual(proto.prefix(), ['__proto__'])
  t.deepEqual(toString.prefix(), ['toString'])

  var consBlerg = cons.sublevel('blerg')
  t.deepEqual(cons.sublevels, {'$blerg': consBlerg})
  t.strictEqual(cons.sublevel('blerg'), consBlerg)
  t.deepEqual(consBlerg.prefix(), ['constructor', 'blerg'])

  var consProto = cons.sublevel('__proto__')
  t.deepEqual(cons.sublevels, {'$blerg': consBlerg, '$__proto__': consProto})
  t.strictEqual(cons.sublevel('__proto__'), consProto)
  t.deepEqual(consProto.prefix(), ['constructor', '__proto__'])

  t.end()
})





