var ltgt = require('ltgt')

//compare two array items
function isArrayLike (a) {
  return Array.isArray(a) || Buffer.isBuffer(a)
}

function isPrimitive (a) {
  return 'string' === typeof a || 'number' === typeof a
}

function has(o, k) {
  return Object.hasOwnProperty.call(o, k)
}

function compare (a, b) {

  if(isArrayLike(a) && isArrayLike(b)) {
    var l = Math.min(a.length, b.length)
    for(var i = 0; i < l; i++) {
      var c = compare(a[i], b[i])
      if(c) return c
    }
    return a.length - b.length
  }
  if(isPrimitive(a) && isPrimitive(b))
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
  if(a.length == 1 && isArrayLike(lastA)) l ++
  
  while(l--) {
    if(compare(a[l], b[l])) return false
  }
  return true
}

exports = module.exports = function (range, key, _compare) {
  _compare = _compare || compare
  //handle prefix specially,
  //check that everything up to the last item is equal
  //then check the last item starts with
  if(isArrayLike(range)) return prefix(range, key)

//  return ltgt.contains(range, key, compare)

  if(range.lt  && _compare(key, range.lt) >= 0) return false
  if(range.lte && _compare(key, range.lte) > 0) return false
  if(range.gt  && _compare(key, range.gt) <= 0) return false
  if(range.gte && _compare(key, range.gte) < 0) return false

  return true
}

function addPrefix(prefix, range) {
  var r = {}
  if(has(range, 'lt')) r.lt = [prefix, range.lt]
  if(has(range, 'gt')) r.gt = [prefix, range.gt]
  if(has(range, 'lte')) r.lte = [prefix, range.lte]
  if(has(range, 'gte')) r.gte = [prefix, range.gte]
  if(has(range, 'start')) {
    if(range.reverse)  r.lte = [prefix, range.start]
    else               r.gte = [prefix, range.start]
  }
  if(has(range, 'end')) {
    if(range.reverse)  r.gte = [prefix, range.end]
    else               r.lte = [prefix, range.end]
  }
  if(has(range, 'min')) r.gte = [prefix, range.min]
  if(has(range, 'max')) r.lte = [prefix, range.max]
  r.reverse = !!range.reverse

  //if there where no ranges, then then just use a prefix.
  if(!r.gte &&!r.lte) return [prefix]

  return r
}

exports.compare = compare
exports.prefix = prefix
exports.addPrefix = addPrefix
