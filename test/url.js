import { expect } from 'chai';
import {
  endsWithFilePath,
  isAbsoluteUrl,
  isProtocolRelUrl,
  mergeQueryParams,
  mergeUrls,
} from '../src/url.js';

describe('url', function () {
  describe('isAbsoluteUrl()', function () {
    it('returns true if the string is an absolute URL (protocol://host)', function () {
      expect(isAbsoluteUrl('http://example.com')).to.be.true;
      expect(isAbsoluteUrl('https://example.net/foo/bar.html')).to.be.true;
      expect(isAbsoluteUrl('ws://example.net/foo?auth=10BF6')).to.be.true;
      expect(isAbsoluteUrl('mqtt://mosquitto:1883')).to.be.true;
    });

    it('returns false if the string is a relative URL', function () {
      expect(isAbsoluteUrl('//example.com')).to.be.false;
      expect(isAbsoluteUrl('//example.com/foo/bar')).to.be.false;
      expect(isAbsoluteUrl('/foo/bar')).to.be.false;
      expect(isAbsoluteUrl('bar/baz.bat')).to.be.false;
    });

    it('returns false if the string is not a URL', function () {
      expect(isAbsoluteUrl('nitwit blubber oddment tweak')).to.be.false;
      expect(isAbsoluteUrl('C:\\Program Files (x86)\\steam')).to.be.false;
      expect(isAbsoluteUrl('.hack//SIGN')).to.be.false;
    });
  });

  describe('isProtocolRelUrl()', function () {
    it('returns true if the string is a protocol-relative URL (starts with //host)', function () {
      expect(isProtocolRelUrl('//example.com')).to.be.true;
      expect(isProtocolRelUrl('//example.net/foo')).to.be.true;
      expect(isProtocolRelUrl('//example.net/foo/bar/baz.bat')).to.be.true;
    });

    it('returns false if the string is an absolute URL', function () {
      expect(isProtocolRelUrl('http://example.com')).to.be.false;
      expect(isProtocolRelUrl('https://example.net/foo/bar')).to.be.false;
    });

    it('returns false if the string is any other type of relative URL', function () {
      expect(isProtocolRelUrl('/foo/bar')).to.be.false;
      expect(isProtocolRelUrl('bar/baz.bat')).to.be.false;
      expect(isProtocolRelUrl('index.html')).to.be.false;
      expect(isProtocolRelUrl('../../images/mqtt.jpg')).to.be.false;
    });

    it('returns false if the string is not a URL', function () {
      expect(isAbsoluteUrl('nitwit blubber oddment tweak')).to.be.false;
      expect(isAbsoluteUrl('C:\\Program Files (x86)\\steam')).to.be.false;
      expect(isAbsoluteUrl('.hack//SIGN')).to.be.false;
    });
  });

  describe('endsWithFilePath()', function () {
    it('returns true if the string ends with a filename-like construction (filename.extn)', function () {
      expect(endsWithFilePath('resume.doc')).to.be.true;
      expect(endsWithFilePath('~/Documents/Secret/ProposalPhotos.zip')).to.be
        .true;
      expect(
        endsWithFilePath(
          'http://example.com/downloads/example-app.amd64.release.10.1.8-beta2.dmg.tar.gz'
        )
      ).to.be.true;
      expect(endsWithFilePath('C:\\Downloads\\definitelynotavirus.exe')).to.be
        .true;
    });

    it('returns false if the string does not end with a filename-like construction', function () {
      expect(isAbsoluteUrl('nitwit blubber oddment tweak')).to.be.false;
      expect(endsWithFilePath('/Applications/Visual Studio Code.app/Contents'))
        .to.be.false;
      expect(isAbsoluteUrl('C:\\Program Files (x86)\\steam')).to.be.false;
      expect(isAbsoluteUrl('.hack//SIGN')).to.be.false;
    });
  });

  describe('mergeUrls()', function () {
    it('returns a single URL with a trailing slash (if appropriate) but otherwise unchanged', function () {
      expect(mergeUrls('http://example.com')).to.equal('http://example.com/');
      expect(mergeUrls('http://example.com/')).to.equal('http://example.com/');
      expect(mergeUrls('/foo/bar/baz')).to.equal('/foo/bar/baz/');
      expect(mergeUrls('/foo/bar/baz/')).to.equal('/foo/bar/baz/');
      expect(mergeUrls('/foo/bar/baz.bat')).to.equal('/foo/bar/baz.bat');
      expect(mergeUrls('foo/bar/baz')).to.equal('foo/bar/baz/');
      expect(mergeUrls('foo/bar/baz/')).to.equal('foo/bar/baz/');
      expect(mergeUrls('foo/bar/baz.bat')).to.equal('foo/bar/baz.bat');
    });

    describe('correctly merges 2 URLs', function () {
      it('merges an absolute URL + absolute URL', function () {
        expect(mergeUrls('http://example.com', 'https://example.net')).to.equal(
          'https://example.net/'
        );
        expect(
          mergeUrls('http://www.example.com/foo', 'https://example.net/bar')
        ).to.equal('https://example.net/bar/');
      });

      it('merges an absolute URL + relative URL', function () {
        expect(mergeUrls('http://example.com', 'foo')).to.equal(
          'http://example.com/foo/'
        );
        expect(mergeUrls('http://example.com/foo/', 'bar')).to.equal(
          'http://example.com/foo/bar/'
        );
        expect(mergeUrls('http://example.com', '/bar/baz.bat')).to.equal(
          'http://example.com/bar/baz.bat'
        );
        expect(mergeUrls('http://example.com/foo', '/bar/baz.bat')).to.equal(
          'http://example.com/bar/baz.bat'
        );
        expect(mergeUrls('http://example.com/foo', 'bar/baz.bat')).to.equal(
          'http://example.com/foo/bar/baz.bat'
        );
      });
    });

    describe('correctly merges 3 URLs', function () {
      it('merges an absolute URL + relative URL + relative URL', function () {
        expect(mergeUrls('http://example.com', '/bar/', 'baz.bat')).to.equal(
          'http://example.com/bar/baz.bat'
        );
      });

      it('merges an absolute URL + absolute URL + relative URL', function () {
        expect(
          mergeUrls('http://example.com', 'https://example.net', '/foo')
        ).to.equal('https://example.net/foo/');
      });

      it('merges an absolute URL + relative URL + absolute URL', function () {
        expect(
          mergeUrls('http://example.com', '/bar/', 'http://example.net')
        ).to.equal('http://example.net/');
      });
    });

    it('discards `undefined` parameters', function () {
      expect(mergeUrls('http://example.com', undefined)).to.equal(
        'http://example.com/'
      );
      expect(mergeUrls('http://example.com', '/foo', undefined)).to.equal(
        'http://example.com/foo/'
      );
      expect(
        mergeUrls('http://example.com/foo', undefined, 'bar.png', undefined)
      ).to.equal('http://example.com/foo/bar.png');
    });
  });

  describe('mergeQueryParams()', function () {
    it('merges disjoint sets of query parameters', function () {
      const a = { class: 'wizard', minLevel: 1 };
      const b = { maxLevel: 5, sort: 'alpha' };
      const c = { limit: 10 };
      const expected = {
        class: 'wizard',
        minLevel: 1,
        maxLevel: 5,
        sort: 'alpha',
        limit: 10,
      };
      expect(mergeQueryParams(a, b, c)).to.deep.equal(expected);
      expect(mergeQueryParams(b, c, a)).to.deep.equal(expected);
      expect(mergeQueryParams(c, a, b)).to.deep.equal(expected);
      expect(mergeQueryParams(a, c, b)).to.deep.equal(expected);
      expect(mergeQueryParams(b, a, c)).to.deep.equal(expected);
      expect(mergeQueryParams(c, b, a)).to.deep.equal(expected);
    });

    it("overwrites a parameter's old value with new value", function () {
      const a = { class: 'warlock', minLevel: 0, sort: 'comp' };
      const b = { minLevel: 1, maxLevel: 5, sort: 'level' };
      const c = { minLevel: 2, maxLevel: 2 };
      const abc = { class: 'warlock', minLevel: 2, maxLevel: 2, sort: 'level' };
      const acb = { class: 'warlock', minLevel: 1, maxLevel: 5, sort: 'level' };
      const bac = { class: 'warlock', minLevel: 2, maxLevel: 2, sort: 'comp' };
      const bca = { class: 'warlock', minLevel: 0, maxLevel: 2, sort: 'comp' };
      const cba = { class: 'warlock', minLevel: 0, maxLevel: 5, sort: 'comp' };
      const cab = { class: 'warlock', minLevel: 1, maxLevel: 5, sort: 'level' };
      expect(mergeQueryParams(a, b, c)).to.deep.equal(abc);
      expect(mergeQueryParams(a, c, b)).to.deep.equal(acb);
      expect(mergeQueryParams(b, a, c)).to.deep.equal(bac);
      expect(mergeQueryParams(b, c, a)).to.deep.equal(bca);
      expect(mergeQueryParams(c, b, a)).to.deep.equal(cba);
      expect(mergeQueryParams(c, a, b)).to.deep.equal(cab);
    });

    it('deletes an old parameter if new value is explicitly `null`', function () {
      const a = { class: 'cleric', minLevel: 0, sort: 'comp' };
      const b = { minLevel: 1, maxLevel: 5, sort: null };
      const c = { minLevel: 2, maxLevel: null };

      expect(mergeQueryParams(a, b, c)).to.have.keys('class', 'minLevel');
      expect(mergeQueryParams(a, c, b)).to.have.keys(
        'class',
        'minLevel',
        'maxLevel'
      );
      expect(mergeQueryParams(b, a, c)).to.have.keys(
        'class',
        'minLevel',
        'sort'
      );
      expect(mergeQueryParams(b, c, a)).to.have.keys(
        'class',
        'minLevel',
        'sort'
      );
      // cba has no null-overriding
      expect(mergeQueryParams(c, a, b)).to.have.keys(
        'class',
        'minLevel',
        'maxLevel'
      );
    });
  });
});
