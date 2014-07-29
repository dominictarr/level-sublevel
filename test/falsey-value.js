var tape     = require('tape')
var sublevel = require('../')
var level    = require('level-test')()

var falsies = [
  0, null, false, ''
]

var db = sublevel(
  level('level-sublevel-falsey', {valueEncoding: 'json'})
)

falsies.forEach(function (falsey, i) {



  tape('allow falsey value:' + JSON.stringify(falsey),
    function (t) {

      db.put('foo', falsey, function (err) {
        if(err) throw err
        db.get('foo', function (err, value) {
          t.deepEqual(value, falsey)
          t.end()
        })
      })
    })
})

