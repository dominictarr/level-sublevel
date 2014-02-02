
var inRange = require('./range')

module.exports = function (compare) {
  var hooks = []


  return {
    add: function (range, hook) {
      var m = {range: range, hook: hook}
      hooks.push(m)
      //call this to remove
      return function () {
        var i = hooks.indexOf(m)
        if(~i) return hooks.slice(i, 1)
      }

    },

    //remove all listeners within a range.
    //this will be used to close a sublevel.
    removeAll: function (range) {
      throw new Error('not implemented')
    },

    trigger: function (key, args) {
      console.log('trigger?', key, hooks)
      for(var i = 0; i < hooks.length; i++) {
        var test = hooks[i]
        console.log('in range?', test.range, key)
        if(inRange(test.range, key))
          test.hook.apply(null, args)
      }
    }
  }
}
