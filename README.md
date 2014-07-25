# level-sublevel

Separate sections of levelup, with hooks!

[![build status](https://secure.travis-ci.org/dominictarr/level-sublevel.png)](http://travis-ci.org/dominictarr/level-sublevel)
[![testling badge](https://ci.testling.com/dominictarr/level-sublevel.png)](https://ci.testling.com/dominictarr/level-sublevel)

This module allows you to create seperate sections of a
[levelup](https://github.com/rvagg/node-levelup) database,
kinda like tables in an sql database, but evented, and ranged,
for real-time changing data.

## level-sublevel@6 **BREAKING CHANGES**

The long awaited `level-sublevel` rewrite is nearly ready,
infact - it is currently _available_,
(`npm install level-sublevel@6`) but it is also a breaking
change. So it's good to use it with a new project,
but I recomment, for now, not upgrading projects that already
use `level-sublevel@5`. The user api is the same as before,
but the way that keys are encoded has changed, and _this means
you cannot run 6 on a database you created with 5_,
if you are using 5 and want to upgrade - please post an issue and 
we'll talk it through

## Stability

Unstable: Expect patches and features, possible api changes.

This is module is working well, but may change in the future as its use is futher explored.

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

Records added via hooks will be atomically inserted with the triggering change.

### Hooks Example

Whenever a record is inserted,
save an index to it by the time it was inserted.

``` js
var sub = db.sublevel('SEQ')

db.pre(function (ch, add) {
  add({
    key: ''+Date.now(), 
    value: ch.key, 
    type: 'put',
    prefix: sub //NOTE pass the destination db to add
               //and the value will end up in that subsection!
  })
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

