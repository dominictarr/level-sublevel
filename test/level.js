var tape = require('tape')

//the mock is partical levelup api.
var mock  = require('./mock')
var nut   = require('../nut')
var shell = require('../shell') //the shell surrounds the nut
var codec = require('key-order')

var db = shell ( nut ( mock(), codec ) )

tape('test - prehook', function (t) {
  var db = shell ( nut ( mock(), codec ) )

  var log = db.sublevel('log')
  var c = 0
  db.pre(function (op, add) {
    add({key: ''+c++, value: op.key, prefix: ['log']})
  })

  db.put('hello', 'there?', function (err) {
    if(err) throw err
    log.get('0', function (err, value) {
      if(err) throw err
      t.equal(value, 'hello')
      t.end()
    })
  })
})

function posthook (args, calls) {
  var db = shell ( nut ( mock(), codec ) )

  var method = args.shift()
  calls = calls || 1
  tape('test - posthook - ' + method, function (t) {

    var cb = 0, hk = 0
    var rm = db.post(function (op) {
      hk ++
      next()
    })
    
    db[method].apply(db, args.concat(function (err) {
      if(err) throw err
      cb ++
      next()
    }))

    function next () {
      if(cb + hk < calls + 1) return
      t.equal(cb, 1)
      t.equal(hk, calls)
      rm()
      t.end()
    }

  })
}

posthook(['put', 'hello', 'there?'])
posthook(['del', 'hello', 'there?'])
//posthook(['batch', [
//  { key: 'foo', value: 'bar', type: 'put'},
//  { key: 'fuz', value: 'baz', type: 'put'},
//  { key: 'fum', value: 'boo', type: 'put'}
//  ]], 3)
//

