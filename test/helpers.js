import { expect } from 'chai';
import { unquote } from '../src/helpers.js';

describe('helpers', function () {
  describe('unquote()', function () {
    const testStrs = {
      noQuotes: {
        plain: 'I am the Batman',
        apostrophe: "Surely you can't be serious!",
        internalDouble: 'We are the knights who say "ni"!',
        internalSingle: "Insert tab 'A' into slot 'B'",
      },
      singleQuotes: {
        plain: "'I am the Batman'",
        apostrophe: "'Surely you can't be serious!'",
        internalDouble: `'We are the knights who say "ni"!'`,
        internalSingle: `'Insert tab 'A' into slot 'B''`,
      },
      doubleQuotes: {
        plain: '"I am the Batman"',
        apostrophe: `"Surely you can't be serious!"`,
        internalDouble: `"We are the knights who say "ni"!"`,
        internalSingle: `"Insert tab 'A' into slot 'B'"`,
      },
    };

    describe('should leave unquoted strings unchanged', function () {
      const {
        plain,
        apostrophe,
        internalDouble,
        internalSingle,
      } = testStrs.noQuotes;
      it('preserves plain strings', function () {
        expect(unquote(plain)).to.equal(plain);
      });
      it('preserves apostrophe-containing strings', function () {
        expect(unquote(apostrophe)).to.equal(apostrophe);
      });
      it('preserves single-quote-containing strings', function () {
        expect(unquote(internalSingle)).to.equal(internalSingle);
      });
      it('preserves double-quote-containing strings', function () {
        expect(unquote(internalDouble)).to.equal(internalDouble);
      });
    });

    describe('should strip outer single quotes', function () {
      const { noQuotes, singleQuotes } = testStrs;
      it('correctly handles single-quoted, plain strings', function () {
        expect(unquote(singleQuotes.plain)).to.equal(noQuotes.plain);
      });
      it('correctly handles single-quoted, apostrophe-containing strings', function () {
        expect(unquote(singleQuotes.apostrophe)).to.equal(noQuotes.apostrophe);
      });
      it('correctly handles single-quoted, single-quote-containing strings', function () {
        expect(unquote(singleQuotes.internalSingle)).to.equal(
          noQuotes.internalSingle
        );
      });
      it('correctly handles single-quoted, double-quote-containing strings', function () {
        expect(unquote(singleQuotes.internalDouble)).to.equal(
          noQuotes.internalDouble
        );
      });
    });

    describe('should strip outer double quotes', function () {
      const { noQuotes, doubleQuotes } = testStrs;
      it('correctly handles double-quoted, plain strings', function () {
        expect(unquote(doubleQuotes.plain)).to.equal(noQuotes.plain);
      });
      it('correctly handles double-quoted, apostrophe-containing strings', function () {
        expect(unquote(doubleQuotes.apostrophe)).to.equal(noQuotes.apostrophe);
      });
      it('correctly handles double-quoted, single-quote-containing strings', function () {
        expect(unquote(doubleQuotes.internalSingle)).to.equal(
          noQuotes.internalSingle
        );
      });
      it('correctly handles double-quoted, double-quote-containing strings', function () {
        expect(unquote(doubleQuotes.internalDouble)).to.equal(
          noQuotes.internalDouble
        );
      });
    });
  });
});
