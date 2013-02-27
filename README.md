# subdb

In memory demo, to test ideas for making leveldb plugins.

example: whenever a record is inserted,
save an index to it by the time it was inserted.

``` js
var sub = db.namespace('SEQ')
db.pre(function (ch, add) {
  add({key: ''+Date.now(), ch.key}, sub)
})
```
Notice that `sub` is the second argument to `add`,
which tells the hook to save the new record in the `sub` section.
