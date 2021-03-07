import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import { FetchError } from 'node-fetch';
import { getJson } from '../src/http.js';

chai.use(chaiAsPromised);

const RESERVED_PORT = 49151; // IANA reserved port, almost certainly closed
const INVALID_DOMAIN = 'foo.invalid.'; // '*.invalid.' is guaranteed to NXDOMAIN

describe('http', function () {
  describe('getJson()', function () {
    it('returns a parsed Javascript object on successful GET with JSON response', async function () {
      const origin = 'http://localhost';
      const path = '/api/foo';
      nock(origin)
        .get(path)
        .reply(200, '{ "foo": "bar", "baz": "bat", "id": 7 }');
      return expect(getJson(origin + path)).to.eventually.deep.equal({
        foo: 'bar',
        baz: 'bat',
        id: 7,
      });
    });

    it('throws an error if response is not valid JSON', async function () {
      const origin = 'http://localhost';
      const path = '/api/foo.xml';
      nock(origin)
        .get(path)
        .reply(
          200,
          '<?xml version="1.0" encoding="UTF-8" ?><root><foo>bar</foo><baz>bat</baz><id>7</id></root>'
        );
      return expect(getJson(origin + path)).to.be.rejectedWith(FetchError);
    });

    it('throws a system error on network issue', async function () {
      // Github doesn't allow outbound connections except to specific services,
      // so it returns EAI_AGAIN when running on their CI infrastructure even
      // though per the DNS spec querying `*.invalid.` *must* return NXDOMAIN.
      // Either way works for our purposes, though, we just need to account for
      // it here:
      const expectedDnsError = process.env.GITHUB_ACTIONS
        ? 'EAI_AGAIN'
        : 'ENOTFOUND';
      return Promise.all([
        expect(
          getJson(`http://${INVALID_DOMAIN}`)
        ).to.be.rejected.and.eventually.have.property('code', expectedDnsError),
        expect(
          getJson(`http://localhost:${RESERVED_PORT}`)
        ).to.be.rejected.and.eventually.have.property('code', 'ECONNREFUSED'),
      ]);
    });

    it('throws an error with the HTTP status code on an HTTP error', async function () {
      const origin = 'http://localhost';
      const path401 = '/api/secret';
      const path404 = '/api/not-found';
      const path500 = '/api/broken-endpoint';
      nock(origin)
        .get(path401)
        .reply(401)
        .get(path404)
        .reply(404)
        .get(path500)
        .reply(500);
      return Promise.all([
        expect(
          getJson(origin + path401)
        ).to.be.rejected.and.eventually.have.property('code', 401),
        expect(
          getJson(origin + path404)
        ).to.be.rejected.and.eventually.have.property('code', 404),
        expect(
          getJson(origin + path500)
        ).to.be.rejected.and.eventually.have.property('code', 500),
      ]);
    });
  });
});
