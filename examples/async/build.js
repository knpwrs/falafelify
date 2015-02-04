var browserify = require('browserify'),
    falafelify = require('../../'),
    fs = require('fs');

// Determines if a node represents a binary math expression
function basicMath(node) {
  return node.type === 'BinaryExpression' && '+-*/'.indexOf(node.operator) > -1;
}

// Async function which basic binary math expressions
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
  }, Math.floor(Math.random() * 1000));
}

// Browserify build
browserify('./async')
  .transform(falafelify(function (node, done) {
    if (basicMath(node)) {
      evaluate(node, done);
    } else {
      // Make sure you ALWAYS call done.
      done();
    }
  }))
  .bundle()
  .pipe(fs.createWriteStream('out.js'));
