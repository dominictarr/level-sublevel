var Bucket = require('range-bucket')
var Hooks  = require('level-hooks')

function SubDB (db, prefix) {
  if(!(this instanceof SubDB)) return new SubDB(db, prefix)
  if(!db)     throw new Error('must provide db')
  if(!prefix) throw new Error('must provide prefix')

  Hooks(db)

  this._parent = db
  this._prefix = prefix
  this._bucket = Bucket(prefix)
}

var SDB = SubDB.prototype

SDB._key = function (key) {
  return this._bucket(key[0] === '\xFF' ? key.substring(1) : key)
}

SDB.put = function (key, value, opts, cb) {
  console.log(key)
  //prehook
  this._parent.put(this._key(key), value, opts, cb)
}

SDB.get = function (key, opts, cb) {
  this._parent.get(this._key(key), opts, cb)
}

SDB.del = function (key, opts, cb) {
  this._parent.del(this._key(key), opts, cb)
}

SDB.batch = function (changes, opts, cb) {
  this._parent.batch(this._key(key), opts, cb)
}

SDB.prefix = function () {
  return this._parent.prefix() + '\xFF' + this._prefix + '\xFF'
}

function root(db) {
  if(!db._parent) return db
  return root(db._parent)
}

SDB.pre = function (hook) {
  var r = root(this._parent)
  r._pre(this.prefix(), hook)
}

var exports = module.exports = SubDB

/*
exports.couple = function (a, b, transform) {
  //Hooks(from); Hooks(to)

  //first, find the mutual parent
  if(a._parent == b._parent) { //<-- simple case
    //register listener on the parent.
    //get the prefixes between the 
    var parent = a._parent
    Hooks(a._parent)
    a.pre(function (changes) {
      changes.forEach(function (e) {
        if(
      })
    })
  }
}
*/
/*
//hmm, maybe the db needs some sort of pipe like thing?
//stream from

db.pipe(db2) //and check if the databases has a common ancestor,
             //if so, insert atomically.
//cos, the thing I need is for it to be easy to transform data from one db to another.
//and... just have a function to transform

so... maybe make 

//compare the prefixes of db and jobs, so you know where to register the listener!
db.pre(jobs, function (batch) {
  return queueFrom(batch)
})

couple(db, jobs).on(function (v) {
  return {key: k, value: v}
  //and it will be prefixed with the right prefix for jobs.
})

jobs.post(function (item) {
  //process the job...
  asyncWhatever(function (err) {
    if(err) return retry(item)
    jobs.del(item.key)
  })
})

jobs.trigger(function(
*/

