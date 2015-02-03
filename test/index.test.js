describe('falafelify tests', function () {
  var rewire = require('rewire'),
      Buffer = require('buffer').Buffer,
      Readable = require('stream').Readable,
      bl = require('bl'),
      fs = require('fs');

  var falafelify = rewire('../lib'),
      browserify = rewire('browserify');

  describe('definition tests', function () {
    it('should be defined as a function with length 2', function () {
      falafelify.should.be.a('function');
      falafelify.length.should.equal(2);
    });
  });

  describe('functionality tests', function () {
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
        iterator.should.be.calledThrice;
        iterator.should.be.calledWith(node);
        b.toString().should.equal(res);
        restore();
        falafelSpy = restore = iterator = f = opts = null;
        done(err);
      }));
    });

    it('should call falafel with a given function when only one argument is given', function () {
      opts = {};
      iterator = sinon.spy();
      f = falafelify(iterator);
    });

    it('should call falafel with a given function when only one argument is given (async)', function () {
      opts = {};
      // stubs don't have length, so we have to program our own spy :(
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0);
      });
      f = falafelify(iterator);
    });

    it('should call falafel with given options and function when two arguments are given', function () {
      opts = {foo: 'bar'};
      iterator = sinon.spy();
      f = falafelify(opts, iterator);
    });

    it('should call falafel with given options and function when two arguments are given (async)', function () {
      opts = {foo: 'bar'};
      // stubs don't have length, so we have to program our own spy :(
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0);
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
      bundler.transform(falafelify(function (node) {
        if (node.type === 'ArrayExpression') {
          node.update('fn(' + node.source() + ')');
        }
      }));
    });

    it('should work with browserify (async)', function () {
      bundler.transform(falafelify(function (node, done) {
        setTimeout(function () {
          if (node.type === 'ArrayExpression') {
            node.update('fn(' + node.source() + ')');
          }
          done();
        }, 0);
      }));
    });
  });
});
