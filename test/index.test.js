describe('falafelify tests', function () {
  var rewire = require('rewire'),
      falafelify = rewire('../lib'),
      bl = require('bl');

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
      f = falafelify(iterator)();
    });

    it('should call falafel with a given function when only one argument is given (async)', function () {
      opts = {};
      // stubs don't have length, so we have to program our own spy :(
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0);
      });
      f = falafelify(iterator)();
    });

    it('should call falafel with given options and function when two arguments are given', function () {
      opts = {foo: 'bar'};
      iterator = sinon.spy();
      f = falafelify(opts, iterator)();
    });

    it('should call falafel with given options and function when two arguments are given (async)', function () {
      opts = {foo: 'bar'};
      // stubs don't have length, so we have to program our own spy :(
      iterator = sinon.spy(function (node, done) {
        setTimeout(done, 0);
      });
      f = falafelify(opts, iterator)();
    });
  });
});
