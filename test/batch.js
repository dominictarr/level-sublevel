var test = require('tape')

function all (db, cb) {
  var obj = {}, fin = false

  function done (err) {
    if(fin) return
    fin = true
    cb(err, obj)
  }
  
  db.createReadStream({end: '\xff\xff'})
    .on('data', function (ch) {
      obj[ch.key] = ch.value
    })
    .on('end', done)
    .on('error', done)
}

test('sublevel - batch', function (t) {

  require('rimraf').sync('/tmp/test-sublevel')
  var base = require('level')('/tmp/test-sublevel')

  var Sublevel = require('../')

  Sublevel(base, { sep: '~' })

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')


  var sum  = 0

  a.batch([
    {key: 'a', value: 1, type: 'put'},
    {key: 'b', value: 2, type: 'put'},
    {key: 'c', value: 3, type: 'put'},
    {key: 'd', value: 4, type: 'put'},
    {key: 'e', value: 5, type: 'put'},
  ], function (err) {
    all(a, function (err, obj) {
      t.notOk(err)
      var keys = Object.keys(obj).join('')
      for(var k in obj) {
        sum += Number(obj[k])
      }
      t.equal(keys, 'abcde')
      t.equal(sum, 15)
      t.end()
    })
  })

})

test('sublevel - prefixed batches', function (t) {

  require('rimraf').sync('/tmp/test-sublevel2')
  var base = require('level')('/tmp/test-sublevel2')

  var Sublevel = require('../')

  Sublevel(base, { sep: '~' })

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')

  base.batch([
    {key: 'a', value: 1, type: 'put'},
    {key: 'b', value: 2, type: 'put', prefix: b},
    {key: 'c', value: 3, type: 'put'},
    {key: 'd', value: 4, type: 'put', prefix: a},
    {key: 'e', value: 5, type: 'put', prefix: base},
  ], function (err) {
    all(base, function (_, obj) {
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
  var base = require('level')('/tmp/test-sublevel3')

  var Sublevel = require('../')

  Sublevel(base, { sep: '~' })

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')

  a.batch([
    {key: 'a', value: 1, type: 'put', prefix: base},
    {key: 'b', value: 2, type: 'put', prefix: b},
    {key: 'c', value: 3, type: 'put', prefix: base},
    {key: 'd', value: 4, type: 'put'},
    {key: 'e', value: 5, type: 'put', prefix: base},
  ], function (err) {
    all(base, function (_, obj) {
      t.deepEqual(obj, {
        'a': '1',
        'c': '3',
        'e': '5',
        '~A~d': '4',
        '~B~b': '2'
      })
      t.end()
    })
  })
})


test('sublevel - prefixed batches on subsection - strings', function (t) {

  require('rimraf').sync('/tmp/test-sublevel4')
  var base = require('level')('/tmp/test-sublevel4')

  var Sublevel = require('../')

  Sublevel(base, { sep: '~' })

  var a    = base.sublevel('A')
  var b    = base.sublevel('B')
  var b_c    = b.sublevel('C')

  base.batch([
    {key: 'a', value: 1, type: 'put'},
    {key: 'b', value: 2, type: 'put', prefix: b.prefix()},
    {key: 'c', value: 3, type: 'put'},
    {key: 'd', value: 4, type: 'put', prefix: a.prefix()},
    {key: 'e', value: 5, type: 'put'},
    {key: 'f', value: 6, type: 'put', prefix: b_c.prefix()},
  ], function (err) {
    all(base, function (_, obj) {
      t.deepEqual(obj, {
        'a': '1',
        'c': '3',
        'e': '5',
        '~A~d': '4',
        '~B~b': '2',
        '~B~~C~f': '6'
      })
      console.log(obj)
      t.end()
    })
  })
})

