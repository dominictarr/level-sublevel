var levelup = require('level')
var base = require('../')(levelup('/tmp/test-streams-sublevel-key-value'))
require('rimraf').sync('/tmp/test-streams-sublevel-key-value')

var test = require('tape')

test('sublevel value streams emit values and sublevel key streams emit keys', function (t) {
  t.plan(4)

  var foo = base.sublevel('foo')

  foo.put('foo1', 'foo1-value', function () {

    var valdata, valerr

    foo.createValueStream({ start: 'foo1', end: 'foo1\xff' })
      .on('data', function (d) { valdata = d })
      .on('error', function (err) { valerr = err })
      .on('end', function () {
        t.notOk(valerr, 'value stream emits no error')  
        t.equal(valdata, 'foo1-value', 'emits value only')  
      })

    var keydata, keyerr

    foo.createKeyStream({ start: 'foo1', end: 'foo1\xff' })
      .on('data', function (d) { keydata = d })
      .on('error', function (err) { keyerr = err })
      .on('end', function () {
        t.notOk(keyerr, 'key stream emits no error')  

        // Getting the full key here may not be desirable, but we cannot change the entire data object,
        // which in this case is just the key after it was emitted
        // One option is to tell levelup to emit the entire object, then mutate the key and delete the value,
        // however pulling out the value when it's not used may have performance implications.
        t.equal(keydata, '\xfffoo\xfffoo1', 'emits fully namespaced key only')  
      })
  })

})
