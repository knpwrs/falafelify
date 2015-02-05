var browserify = require('browserify'),
    falafelify = require('../../'),
    fs = require('fs');

// Determines if a node represents a binary math expression
function basicMath(node) {
  return node.type === 'BinaryExpression'
    && '+-*/'.indexOf(node.operator) > -1
    && node.left.type === 'Literal'
    && node.right.type === 'Literal';
}

// Async function which, given a BinaryExpression node, performs basic binary
// math expressions and updates the node with the calculated value.
function evaluate(node, done) {
  setTimeout(function () {
    node.update(eval(node.source()));
    done();
  }, 250);
}

// Browserify build
browserify('./async')
  // First argument is the iterator, second argument is the parallel limit.
  .transform(falafelify(function (node, done) {
    if (basicMath(node)) {
      evaluate(node, done);
    } else {
      // Make sure you ALWAYS call done.
      done();
    }
  }, 20))
  .bundle()
  .pipe(fs.createWriteStream('out.js'));
