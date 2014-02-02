var tape = require('tape')

//the mock is partical levelup api.
var mock  = require('./mock')
var nut   = require('../nut')
var shell = require('../shell') //the shell surrounds the nut
var codec = require('key-order')

function create () {
  return shell ( nut ( mock(), codec ) )
}

var db = create()

function prehookPut (db) {
  tape('test - prehook - put', function (t) {
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
}

function prehookBatch (db) {
  tape('test - prehook - put', function (t) {
    var db = shell ( nut ( mock(), codec ) )

    var log = db.sublevel('log')
    var c = 0
    db.pre(function (op, add) {
      add({key: ''+c++, value: op.key, prefix: ['log']})
    })

    db.batch([
      {key:'hello1', value: 'there.', type: 'put'},
      {key:'hello2', value: 'there!', type: 'put'},
      {key:'hello3', value: 'where?', type: 'put'},
    ], function (err) {
      if(err) throw err
      log.get('0', function (err, value) {
        if(err) throw err
        t.equal(value, 'hello1')
        log.get('1', function (err, value) {
          if(err) throw err
          t.equal(value, 'hello2')
          log.get('2', function (err, value) {
            if(err) throw err
            t.equal(value, 'hello3')
            t.end()
          })
        })
      })
    })
  })
}


prehookPut(db)
prehookPut(db.sublevel('foo'))

var db2 = create()

prehookBatch(db2)
prehookBatch(db2.sublevel('foo'))
//return
function posthook (args, calls, db) {
  db = db || shell ( nut ( mock(), codec ) )

  var method = args.shift()
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

// test posthooks trigger correct number of times

posthook(['put', 'hello', 'there?'], 1)
posthook(['del', 'hello', 'there?'], 1)
posthook(['batch', [
  { key: 'foo', value: 'bar', type: 'put'},
  { key: 'fuz', value: 'baz', type: 'put'},
  { key: 'fum', value: 'boo', type: 'put'}
  ]], 3)

// test posthooks also work in sublevels

posthook(['put', 'hello', 'there?'], 1, db.sublevel('a'))
posthook(['del', 'hello', 'there?'], 1, db.sublevel('b'))
posthook(['batch', [
  { key: 'foo', value: 'bar', type: 'put'},
  { key: 'fuz', value: 'baz', type: 'put'},
  { key: 'fum', value: 'boo', type: 'put'}
  ]], 3, db.sublevel('c'))

//test removing hooks.

function rmHook (db) {
  tape('test - prehook - put', function (t) {
    var db = shell ( nut ( mock(), codec ) )

    var hk = 0
    var rm = db.pre(function (op, add) {
      hk ++
      t.equal(op.key, 'hello')
      t.equal(op.value, 'there')
    })

    db.put('hello', 'there', function (err) {
      if(err) throw err
      t.equal(hk, 1)
      db.put('hello', 'where?', function (err) {
        if(err) throw err
        t.equal(hk, 1)
        t.end()
      })
    })
    rm()

  })
  
}

var db3 = create()

rmHook(db3)
rmHook(db3.sublevel('foo'))

