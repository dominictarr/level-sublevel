require('tape')('sublevel', function (t) {

  require('rimraf').sync('/tmp/test-subdb')

  var base = require('levelup')('/tmp/test-sublevel', function () {
    var Sublevel = require('../')

    Sublevel(base, '~')

    var a    = base.sublevel('A')
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
})
