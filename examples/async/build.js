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
  var o = node.operator, left = node.left.value, right = node.right.value;
  setTimeout(function () {
    if (o === '+') {
      node.update(left + right);
    } else if (o === '-') {
      node.update(left - right);
    } else if (o === '*') {
      node.update(left * right);
    } else if (o === '/') {
      node.update(left / right);
    } else {
      return done(new Error('Invalid operator.'));
    }
    // Make sure you ALWAYS call done.
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
