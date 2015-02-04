var through2 = require('through2'),
    falafel = require('falafel'),
    async = require('async');

/**
 * Creates and returns browserify transform for falafel.
 * @param  {Object}   opts  (Optional) Options to pass to falafel.
 * @param  {Function} fn    The transform function to pass to falafel.
 * @param  {Number}   limit The maximum number of transformations to run in
 *     parallel. Defaults to 10.
 * @return {Function}
 */
module.exports = function (opts, fn, limit) {
  // Argument overloading
  if (arguments.length === 1) {
    fn = opts;
    opts = {};
    limit = 10;
  } else if (arguments.length === 2) {
    if (typeof opts === 'function') {
      limit = fn;
      fn = opts;
      opts = {};
    } else {
      limit = 10;
    }
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
      var fns = [], that = this;
      // Run falafel (sync) building a list of functions (one per ast node)
      var res = falafel(buf, opts, function (node) {
        fns.push(function (done) {
          if (fn.length > 1) {
            fn(node, done);
          } else {
            fn(node);
            done();
          }
        });
      });
      // Run ast node functions in parallel with limited concurrency.
      async.parallelLimit(fns, limit, function (err) {
        if (err) return that.emit('error', err);
        that.push(res.toString());
        done();
      });
    }
  };
};
