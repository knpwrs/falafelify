var browserify = require('browserify'),
    falafelify = require('../../'),
    fs = require('fs');

// Browserify build
browserify('./arrays')
  .transform(falafelify(function (node) {
    if (node.type === 'ArrayExpression') {
      node.update('fn(' + node.source() + ')');
    }
  }))
  .bundle()
  .pipe(fs.createWriteStream('out.js'));
