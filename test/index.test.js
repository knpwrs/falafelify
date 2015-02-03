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
    var falafelStub, restore, spy, f, opts;

    beforeEach(function () {
      falafelStub = sinon.stub().callsArgWith(2, node).returns(res);
      restore = falafelify.__set__('falafel', falafelStub);
      spy = sinon.spy();
    });

    afterEach(function (done) {
      f.write(src);
      f.end();
      f.pipe(bl(function (err, b) {
        falafelStub.should.be.calledWith(src, opts, spy);
        spy.should.be.calledWith(node);
        b.toString().should.equal(res);
        restore();
        falafelStub = restore = spy = f = opts = null;
        done(err);
      }));
    });

    it('should call falafel with a given function when only one argument is given', function () {
      opts = {};
      f = falafelify(spy)();
    });

    it('should call falafel with given options and function when two arguments are given', function () {
      opts = {foo: 'bar'};
      f = falafelify(opts, spy)();
    });
  });
});
