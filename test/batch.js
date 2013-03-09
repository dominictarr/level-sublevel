var test = require('tape')

test('sublevel - batch', function (t) {

  require('rimraf').sync('/tmp/test-sublevel')
  var base = require('levelup')('/tmp/test-sublevel')

  var Sublevel = require('../')

  Sublevel(base, '~')

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')


  var keys = ''
  var sum  = 0

  a.batch([
    {key: 'a', value: 1, type: 'put'},
    {key: 'b', value: 2, type: 'put'},
    {key: 'c', value: 3, type: 'put'},
    {key: 'd', value: 4, type: 'put'},
    {key: 'e', value: 5, type: 'put'},
  ], function (err) {
    a.createReadStream()
      .on('data', function (ch) {
        keys += ch.key
        sum += Number(ch.value)
      })
      .on('end', function () {
        t.equal(keys, 'abcde')
        t.equal(sum, 15)
        t.end()
      })
  })

})

test('sublevel - prefixed batches', function (t) {

  require('rimraf').sync('/tmp/test-sublevel2')
  var base = require('levelup')('/tmp/test-sublevel2')

  var Sublevel = require('../')

  Sublevel(base, '~')

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')

  var obj = {}

  base.batch([
    {key: 'a', value: 1, type: 'put'},
    {key: 'b', value: 2, type: 'put', prefix: b},
    {key: 'c', value: 3, type: 'put'},
    {key: 'd', value: 4, type: 'put', prefix: a},
    {key: 'e', value: 5, type: 'put', prefix: base},
  ], function (err) {
    base.createReadStream()
      .on('data', function (ch) {
        obj[ch.key] = ch.value
      })
      .on('end', function () {
        t.deepEqual(obj, {
          'a': '1',
          'c': '3',
          'e': '5',
          '~A~d': '4',
          '~B~b': '2'
        })
        console.log(obj)
        t.end()
      })
  })

})

test('sublevel - prefixed batches on subsection', function (t) {

  require('rimraf').sync('/tmp/test-sublevel3')
  var base = require('levelup')('/tmp/test-sublevel3')

  var Sublevel = require('../')

  Sublevel(base, '~')

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')

  var obj = {}

  a.batch([
    {key: 'a', value: 1, type: 'put', prefix: base},
    {key: 'b', value: 2, type: 'put', prefix: b},
    {key: 'c', value: 3, type: 'put', prefix: base},
    {key: 'd', value: 4, type: 'put'},
    {key: 'e', value: 5, type: 'put', prefix: base},
  ], function (err) {
    base.createReadStream()
      .on('data', function (ch) {
        obj[ch.key] = ch.value
      })
      .on('end', function () {
        t.deepEqual(obj, {
          'a': '1',
          'c': '3',
          'e': '5',
          '~A~d': '4',
          '~B~b': '2'
        })
        console.log(obj)
        t.end()
      })
  })

})


