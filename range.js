//compare two array items
function compare (a, b) {
 if(Array.isArray(a) && Array.isArray(b)) {
    var l = Math.min(a.length, b.length)
    for(var i = 0; i < l; i++) {
      var c = compare(a[i], b[i])
      if(c) return c
    }
    return a.length - b.length
  }
  if('string' == typeof a && 'string' == typeof b)
    return a < b ? -1 : a > b ? 1 : 0

  throw new Error('items not comparable:'
    + JSON.stringify(a) + ' ' + JSON.stringify(b))
}

//this assumes that the prefix is of the form:
// [Array, string]

function prefix (a, b) {
  if(a.length > b.length) return false
  var l = a.length - 1
  var lastA = a[l]
  var lastB = b[l]

  if(typeof lastA !== typeof lastB)
    return false

  if('string' == typeof lastA
    && 0 != lastB.indexOf(lastA))
      return false
  
  //handle cas where there is no key prefix
  //(a hook on an entire sublevel)
  if(a.length == 1 && Array.isArray(lastA)) l ++
  
  while(l--) {
    if(compare(a[l], b[l])) return false
  }
  return true
}

exports = module.exports = function (range, key) {
  //handle prefix specially,
  //check that everything up to the last item is equal
  //then check the last item starts with
  if(Array.isArray(range)) return prefix(range, key)

  if(range.lt  && compare(key, range.lt) >= 0) return false
  if(range.lte && compare(key, range.lte) > 0) return false
  if(range.gt  && compare(key, range.gt) <= 0) return false
  if(range.gte && compare(key, range.gte) < 0) return false

  return true
}

exports.compare = compare
exports.prefix = prefix
