# falafelify [![Build Status](https://travis-ci.org/KenPowers/falafelify.svg?branch=master)](https://travis-ci.org/KenPowers/falafelify) [![Coverage Status](https://coveralls.io/repos/KenPowers/falafelify/badge.svg?branch=master)](https://coveralls.io/r/KenPowers/falafelify?branch=master)

Serve up fresh [falafel][f] from your [browserify][b] bundles.

## What?

This is a [browserify][b] [transform][t] that runs your files through
[falafel][f]. Basically you can alter your scripts by modifying the abstract
syntax tree that they are parsed in to.

## Installation

```sh
npm i --save falafelify
```

Or if you want something a little more fresh:

```sh
npm i --save KenPowers/falafelify
```

## Usage

Here are some examples that I ~~stole~~ ~~borrowed~~ adapted from [falafel][f]
as well as an original example (also available under the `examples`
directory):

### Wrap Arrays

This example shows how to wrap arrays (including nested arrays) in a function
call.

`arrays.js`:

```js
(function () {
  var xs = [1, 2, [3, 4]];
  var ys = [5, 6];
  console.dir([xs, ys]);
})();
```

`build.js`:

```js
var browserify = require('browserify'),
    falafelify = require('falafelify'),
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
```

Run `node build` and get the following:

`out.js`:

```js
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {
  var xs = fn([1, 2, fn([3, 4])]);
  var ys = fn([5, 6]);
  console.dir(fn([xs, ys]));
})();

},{}]},{},[1]);
```

### Custom Keywords

This example shows how to create a custom keyword. In this case `beep` is a
unary operator which converts its argument to a `String` and uppercases it:

`keywords.js`:

```js
console.log(beep 'boop', 'BOOP');
```

`build.js`:

```js
var browserify = require('browserify'),
    falafelify = require('falafelify'),
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
```

Run `node build` and get the following:

`out.js`:

```js
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
console.log(String('boop').toUppercase(), 'BOOP');

},{}]},{},[1]);
```

### Async

Unlike the regular [falafel][f], falafelify lets you use async functions as
your iterator using standard node callbacks. This example shows how to update
ast nodes asynchronously:

`async.js`:

```js
console.log(2 + 2);
console.log(2 - 2);
console.log(2 * 2);
console.log(2 / 2);
```

`build.js`:

```js
var browserify = require('browserify'),
    falafelify = require('falafelify'),
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
    done();
  }, Math.floor(Math.random() * 1000));
}

// Browserify build
browserify('./async')
  .transform(falafelify(function (node, done) {
    if (basicMath(node)) {
      evaluate(node, done);
    } else {
      done();
    }
  }))
  .bundle()
  .pipe(fs.createWriteStream('out.js'));
```

Run `node build` and get the following:

`out.js`:

```js
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
console.log(4);
console.log(0);
console.log(4);
console.log(1);

},{}]},{},[1]);
```

## API

All of the following invocations are valid:

```js
// Just a function (callback optional)
falafelify(fn);
// Options and function
falafelify(opts, fn);
// Function and parallel limit (number)
falafelify(fn, limit);
// Options, function, and parallel limit (number)
falafelify(opts, fn, limit);
```

## License

The MIT License (MIT)

Copyright (c) 2015 Kenneth Powers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[b]: http://browserify.org/ "browserify"
[f]: https://www.npmjs.com/package/falafel "falafel"
[t]: https://github.com/substack/node-browserify/wiki/list-of-transforms "List of browserify transforms."
