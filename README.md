# level-sublevel

Separate sections of levelup, with hooks!

## Status - Experimental

Anticipate Breaking Changes - please provide feedback.

## Example

``` js
var LevelUp = require('levelup')
var Sublevel = require('level-sublevel')

var db = Sublevel(LevelUp('/tmp/sublevel-example'))
var sub = db.sublevel('stuff')

//put a key into the main levelup
db.put(key, value, function () {
  
})

//put a key into the sub-section!
sub.put(key2, value, function () {

})
```

Sublevel prefixes each subsection so that it will not collide
with the outer db when saving or reading!

## Hooks

Hooks are specially built into Sublevel so that you can 
do all sorts of clever stuff, like generating views or
logs when records are inserted!

Records added via hooks will be atomically with the triggering change.

### Hooks Example

Whenever a record is inserted,
save an index to it by the time it was inserted.

``` js
var sub = db.sublevel('SEQ')

db.pre(function (ch, add) {
  add({
    key: ''+Date.now(), 
    value: ch.key, 
    type: 'put'
  }, sub) //NOTE pass the destination db to add
          //and the value will end up in that subsection!
})

db.put('key', 'VALUE', function (err) {

  //read all the records inserted by the hook!

  sub.createReadStream()
    .on('data', console.log)

})
```

Notice that `sub` is the second argument to `add`,
which tells the hook to save the new record in the `sub` section.

## Batches

In `sublevel` batches also support a `prefix: subdb` property,
if set, this row will be inserted into that database section,
instead of the current section.

``` js
var sub1 = db.sublevel('SUB_1')
var sub2 = db.sublevel('SUM_2')

sub.batch([
  {key: 'key', value: 'Value', type: 'put'},
  {key: 'key', value: 'Value', type: 'put', prefix: sub2},
], function (err) {...})
```

## License

MIT

