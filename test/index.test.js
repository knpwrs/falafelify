describe('falafelify tests', function () {
  var rewire = require('rewire'),
      async = require('async'),
      Buffer = require('buffer').Buffer,
      Readable = require('stream').Readable,
      bl = require('bl'),
      fs = require('fs');

  var falafelify = rewire('../lib'),
      browserify = rewire('browserify');

  describe('definition tests', function () {
    it('should be defined as a function with length 3', function () {
      falafelify.should.be.a('function');
      falafelify.length.should.equal(3);
    });
  });

  describe('functionality tests', function () {
    var src = 'SOURCE', res = 'TARGET', node = 'NODE';
    var clock, falafelSpy, restore, iterator, f, opts, limit;

    function getAsyncSpy() {
      // stubs don't have length, so we have to program our own spy :(
      return sinon.spy(function (node, done) {
        setTimeout(done, 0);
      });
    }

    beforeEach(function () {
      // clock = sinon.useFakeTimers();
      // Not using a stub in order to synchronously iterate
      falafelSpy = sinon.spy(function (b, o, f) {
        for (var i = 0; i < 3; i++) {
          f(node);
        }
        return res;
      });
      restore = falafelify.__set__('falafel', falafelSpy);
      sinon.spy(async, 'parallelLimit');
    });

    afterEach(function (done) {
      f = f();
      f.write(src);
      f.end();
      f.pipe(bl(function (err, b) {
        falafelSpy.should.be.calledOnce;
        falafelSpy.should.be.calledWith(src, opts, sinon.match.func);
        async.parallelLimit.should.be.calledOnce;
        async.parallelLimit.should.be.calledWith(sinon.match.array, limit, sinon.match.func);
        async.parallelLimit.restore();
        iterator.should.be.calledThrice;
        iterator.should.be.calledWith(node);
        b.toString().should.equal(res);
        restore();
        falafelSpy = restore = iterator = f = opts = null;
        done(err);
      }));
    });

    [{
      it: 'should call falafel with a given function',
      spy: sinon.spy()
    }, {
      it: 'should call falafel with a given function (async)',
      spy: getAsyncSpy()
    }].forEach(function (o) {
      it(o.it, function () {
        opts = {};
        limit = 10;
        iterator = o.spy;
        f = falafelify(iterator);
      });
    });

    [{
      it: 'should call falafel with given options and function',
      spy: sinon.spy()
    }, {
      it: 'should call falafel with given options and function (async)',
      spy: getAsyncSpy()
    }].forEach(function (o) {
      it(o.it, function () {
        opts = {foo: 'bar'};
        limit = 10;
        iterator = o.spy;
        f = falafelify(opts, iterator);
      });
    });

    [{
      it: 'should call falafel with given function and limit (not that it matters when not async)',
      spy: sinon.spy()
    }, {
      it: 'should call falafel with given function and limit (async)',
      spy: getAsyncSpy()
    }].forEach(function (o) {
      it(o.it, function () {
        opts = {};
        limit = 20;
        iterator = o.spy;
        f = falafelify(iterator, limit);
      });
    });

    [{
      it: 'should call call falafel with given options, function, and limit (not that it matters when not async)',
      spy: sinon.spy()
    }, {
      it: 'should call call falafel with given options, function, and limit (async)',
      spy: getAsyncSpy()
    }].forEach(function (o) {
      it(o.it, function () {
        opts = {foo: 'bar'};
        limit = 20;
        iterator = o.spy;
        f = falafelify(opts, iterator, limit);
      });
    });
  });

  describe('error handling tests', function () {
    var src = 'SOURCE', res = 'TARGET', node = 'NODE';
    var falafelSpy, restore, iterator, f, opts;

    beforeEach(function () {
      // Not using a stub in order to synchronously iterate
      falafelSpy = sinon.spy(function (b, o, f) {
        for (var i = 0; i < 3; i++) {
          f(node);
        }
        return res;
      });
      restore = falafelify.__set__('falafel', falafelSpy);
    });

    afterEach(function (done) {
      f = f();
      f.write(src);
      f.end();
      f.pipe(bl(function (err, b) {
        falafelSpy.should.be.calledWith(src, opts, sinon.match.func);
        err.should.equal('error');
        expect(b).to.not.be.ok;
        restore();
        done();
      }));
    });

    it('should handle errors in async mode', function () {
      opts = {};
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0, 'error');
      });
      f = falafelify(iterator);
    });

    it('should handle errors in async mode with options', function () {
      opts = {foo: 'bar'};
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0, 'error');
      });
      f = falafelify(opts, iterator);
    });
  });

  describe('integration tests', function () {
    var bresolve, restore, bundler, src = '(' + function () {
      var xs = [1, 2, [3, 4]];
      var ys = [5, 6];
      console.dir(xs, ys);
    } + ')()';

    function handleNode(node) {
      if (node.type === 'ArrayExpression') {
        node.update('fn(' + node.source() + ')');
      }
    }

    beforeEach(function () {
      // Fake fs.createReadStream
      var s = new Readable();
      s.push(src);
      s.push(null);
      sinon.stub(fs, 'createReadStream').returns(s);
      // Fake browser-resolve
      bresolve = sinon.stub().yields(null, 'foo');
      restore = browserify.__set__('bresolve', bresolve);
      // Create bundler
      bundler = browserify().require('foo', {entry: true});
    });

    afterEach(function (done) {
      bundler.bundle().pipe(bl(function (err, b) {
        bresolve.should.be.calledOnce;
        bresolve.should.be.calledWith('foo', sinon.match.object, sinon.match.func);
        fs.createReadStream.should.be.calledOnce;
        fs.createReadStream.should.be.calledWith('foo');
        fs.createReadStream.restore();
        var str = b.toString();
        str.should.contain('var xs = fn([1, 2, fn([3, 4])]);');
        str.should.contain('var ys = fn([5, 6]);');
        restore();
        restore = bundler = null;
        done(err);
      }));
    });

    it('should work with browserify', function () {
      bundler.transform(falafelify(handleNode));
    });

    it('should work with browserify (async)', function () {
      bundler.transform(falafelify(function (node, done) {
        setTimeout(function () {
          handleNode(node);
          done();
        }, 0);
      }));
    });
  });
});
