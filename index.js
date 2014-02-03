
// Currently this uses pull streams,
// and not levelup's readstream, but in theory
// I should be able pretty much just drop that in.

module.exports = function (db) {

  //convert pull stream to iterators
  function pullIterator (iterator) {
    return function (end, cb) {
      if(!end) iterator.get(function (err, key, value) {
                if(err) return cb(err)
                if(key===undefined || value === undefined)
                        return cb(true)
                cb(null, {key: key, value: value})
      })
      else
        iterator.end(cb)
    }
  }

  return shell ( nut ( mock(), codec ), [], pullIterator )
  
}
