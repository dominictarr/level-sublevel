var test = require('tape')

function all (db, range, cb) {
  var o = {}
  db.createReadStream(range)
    .on('data', function (data) {
      o[data.key] = data.value
    })
    .on('end', function () {
      cb(null, o)
    })
}

function makeTest(db, name) {

  test(name, function (t) {

    t.plan(10)

    var docs = {
      a: 'apple',
      b: 'banana',
      c: 'cherry',
      d: 'durian',
      e: 'elder-berry'
    }

    db.batch(Object.keys(docs).map(function (key) {
      console.log(key, docs[key])
      return {key: key, value: docs[key], type: 'put'}
    }), function (err) {
      t.notOk(err) 

      all(db, {}, function (err, all) {
        t.deepEqual(all, docs)
      })

      all(db, {min: 'a~'}, function (err, all) {
        t.deepEqual(all, {
          b: 'banana',
          c: 'cherry',
          d: 'durian',
          e: 'elder-berry'
        })
      })

      all(db, {min: 'b'}, function (err, all) {
        t.deepEqual(all, {
          b: 'banana',
          c: 'cherry',
          d: 'durian',
          e: 'elder-berry'
        })
      })


      all(db, {min: 'a~', reverse: true}, function (err, all) {
        t.deepEqual(all, {
          b: 'banana',
          c: 'cherry',
          d: 'durian',
          e: 'elder-berry'
        })
      })

      all(db, {min: 'c~', reverse: true}, function (err, all) {
        console.log(all)
        t.deepEqual(all, {
          d: 'durian',
          e: 'elder-berry'
        })
      })

      all(db, {min: 'c~', max: 'd~'}, function (err, all) {
        console.log(all)
        t.deepEqual(all, {
          d: 'durian',
        })
      })

      all(db, {min: 'a~'}, function (err, all) {
        t.deepEqual(all, {
          b: 'banana',
          c: 'cherry',
          d: 'durian',
          e: 'elder-berry'
        })
      })

      all(db, {min: 'c~'}, function (err, all) {
        console.log(all)
        t.deepEqual(all, {
          d: 'durian',
          e: 'elder-berry'
        })
      })

      all(db, {min: 'c~', max: 'd~', reverse: true}, function (err, all) {
        console.log(all)
        t.deepEqual(all, {
          d: 'durian',
        })
      })
    })
  })
}



require('rimraf').sync('/tmp/test-sublevel-reverse')

var base = require('../')
  (require('levelup')('/tmp/test-sublevel-reverse'))
var A = base.sublevel('A')
makeTest(base, 'simple')

makeTest(A, 'sublevel')

makeTest(base, 'simple, again')

var A_B = A.sublevel('B')
makeTest(A_B, 'sublevel2')

makeTest(A, 'sublevel, again')

makeTest(base, 'simple, again 2')

