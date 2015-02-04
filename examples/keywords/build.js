var browserify = require('browserify'),
    falafelify = require('../../'),
    fs = require('fs');

// Determines if a given identifier is a keyword
function isKeyword(id) {
  return id === 'beep';
}

// Browserify build, notice the `isKeyword` option passed to falafelify.
browserify('./keywords')
  .transform(falafelify({isKeyword: isKeyword}, function (node) {
    if (node.type === 'UnaryExpression' && node.keyword === 'beep') {
      node.update('String(' + node.argument.source() + ').toUppercase()');
    }
  }))
  .bundle()
  .pipe(fs.createWriteStream('out.js'));
