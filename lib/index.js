var through2 = require('through2'),
    falafel = require('falafel');

/**
 * Creates and returns browserify transform for falafel.
 * @param  {Object}   opts (Optional) Options to pass to falafel.
 * @param  {Function} fn   The transform function to pass to falafel.
 * @return {Function}
 */
module.exports = function (opts, fn) {
  // Argument overloading
  if (arguments.length < 2) {
    fn = opts;
    opts = {};
  }
  // TRANSFORM!
  return function () {
    var buf = '';
    return through2(write, end);

    function write(chunk, enc, done) {
      buf += chunk;
      done();
    }

    function end(done) {
      var _done, res, err, ongoing = 0, that = this;
      _done = function (_err) {
        if (err) return;
        if (err = _err) return that.emit('error', err);
        if (--ongoing === 0) {
          that.push(res.toString());
          done();
        }
      }
      res = falafel(buf, opts, function (node) {
        ongoing++;
        setTimeout(function () {
          if (fn.length > 1) {
            fn(node, _done);
          } else {
            fn(node);
            _done();
          }
        }, 0);
      });
    }
  };
};
