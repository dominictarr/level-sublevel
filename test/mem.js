

var mem = require('../')()

mem.put('key', 'value', function (err) {
  if(err) throw err
  mem.batch([
    {type: 'put', key: 'key1', value: Math.random()},
    {type: 'put', key: 'key2', value: Math.random()}
  ], function (err) {
    console.log(mem.store)
  })
})
