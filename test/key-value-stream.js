
var pl       = require('pull-level')
var pull     = require('pull-stream')
var streamTo = require('stream-to');

var level = require('level-test')()
var sublevel = require('../')
var tape = require('tape')

tape('keys', function (t) {

  var db = sublevel(level()).sublevel('test')

  pull.count(10)
    .pipe(pull.map(function (i) {
      return {key: 'key_'+i, value: 'value_' + i}
    }))
    .pipe(pl.write(db, function (err) {
      if(err) {
        t.notOk(err)
        throw err
      }

      streamTo.array(db.createKeyStream(), function (err, ary) {
        console.log(ary)
        ary.forEach(function (e) {
          t.equal(typeof e, 'string')
          t.ok(/^key_/.test(e))
        })
        streamTo.array(db.createValueStream(), function (err, ary) {
          console.log(ary)
          ary.forEach(function (e) {
            t.equal(typeof e, 'string')
            t.ok(/^value_/.test(e))
            console.log(e)
          })

          t.end()
        })
      })
    }))
})

