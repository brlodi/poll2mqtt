import { expect } from 'chai';
import { cloneDeep } from 'lodash-es';
import * as td from 'testdouble';

describe('endpoints', function () {
  describe('flattenServices()', function () {
    beforeEach(async function () {
      this.url = await td.replaceEsm('../src/url.js');
      this.subject = await import('../src/endpoints.js');
      td.when(
        this.url.mergeUrls('http://example.com/blog', 'posts/3/comments')
      ).thenReturn('http://example.com/blog/posts/3/comments');
      td.when(
        this.url.mergeUrls('http://example.com/blog', 'categories')
      ).thenReturn('http://example.com/blog/categories');
      td.when(
        this.url.mergeQueryParams(
          { sort_posts: 'date_desc', foo: 'bar' },
          { sort: 'top' }
        )
      ).thenReturn({ sort_posts: 'date_desc', foo: 'bar', sort: 'top' });
      td.when(
        this.url.mergeQueryParams(
          { sort_posts: 'date_desc', foo: 'bar' },
          { sort_posts: 'date_asc' }
        )
      ).thenReturn({ sort_posts: 'date_asc', foo: 'bar' });
    });

    afterEach(function () {
      td.reset();
    });

    const singleTopicEndpoint = {
      name: 'Single Topic Endpoint',
      url: 'posts/3/comments',
      query: {
        sort: 'top',
      },
      interval: 120,
      topic: 'blog/posts/3/comments/top_comment',
      path: 'data[0]',
      force: true,
    };
    const multiTopicEndpoint = {
      name: 'Multi-topic Endpoint',
      url: 'categories',
      query: {
        sort_posts: 'date_asc',
      },
      topics: [
        { topic: 'blog/mqtt/first', path: "data['MQTT'][0]" },
        { topic: 'blog/javascript/first', path: "data['javascript'][0]" },
        { topic: 'blog/cooking/first', path: "data['cooking'][0]" },
      ],
    };
    const serviceA = {
      name: 'Service A',
      url: 'http://example.com/blog',
      query: {
        sort_posts: 'date_desc',
        foo: 'bar',
      },
      interval: 86400,
      endpoints: [singleTopicEndpoint, multiTopicEndpoint],
    };
    const testServices = [serviceA];

    it('returns a flat array of endpoints', async function () {
      const result = this.subject.flattenServices(testServices);
      expect(result).to.be.an('array').that.is.not.empty;
      for (const elem of result) {
        expect(elem)
          .to.be.an('object')
          .that.has.keys('name', 'url', 'query', 'interval', 'topics', 'force');
      }
    });

    it('endpoints inherit from parent services', async function () {
      const result = this.subject.flattenServices(testServices);
      expect(result[0]).to.deep.equal({
        name: 'Service A - Single Topic Endpoint',
        url: 'http://example.com/blog/posts/3/comments',
        query: { sort_posts: 'date_desc', foo: 'bar', sort: 'top' },
        interval: 120,
        topics: [
          {
            topic: 'blog/posts/3/comments/top_comment',
            path: 'data[0]',
          },
        ],
        force: true,
      });
    });

    describe('name resolution', function () {
      it('uses service name and endpoint name if both present', async function () {
        const resolvedName = this.subject.flattenServices([serviceA])[0].name;
        expect(resolvedName).to.equal('Service A - Single Topic Endpoint');
      });
      it('uses service name and endpoint URL if endpoint has no name', async function () {
        const services = cloneDeep(testServices);
        delete services[0].endpoints[0].name;
        const resolvedName = this.subject.flattenServices(services)[0].name;
        expect(resolvedName).to.equal('Service A - posts/3/comments');
      });
      it('uses service name and sequential number if endpoint has no name or URL', async function () {
        const services = cloneDeep(testServices);
        delete services[0].endpoints[1].name;
        delete services[0].endpoints[1].url;
        const resolvedName = this.subject.flattenServices(services)[1].name;
        expect(resolvedName).to.equal('Service A - Endpoint 2');
      });
      it('uses service URL and endpoint name if service has no name', async function () {
        const services = cloneDeep(testServices);
        delete services[0].name;
        const resolvedName = this.subject.flattenServices(services)[0].name;
        expect(resolvedName).to.equal(
          'http://example.com/blog - Single Topic Endpoint'
        );
      });
      it('uses service URL and endpoint URL if neither service nor endpoint have a name', async function () {
        const services = cloneDeep(testServices);
        delete services[0].name;
        delete services[0].endpoints[0].name;
        const resolvedName = this.subject.flattenServices(services)[0].name;
        expect(resolvedName).to.equal(
          'http://example.com/blog - posts/3/comments'
        );
      });
      it('uses service URL and sequential number if service has no name and endpoint has no name or URL', async function () {
        const services = cloneDeep(testServices);
        delete services[0].name;
        delete services[0].endpoints[1].name;
        delete services[0].endpoints[1].url;
        const resolvedName = this.subject.flattenServices(services)[1].name;
        expect(resolvedName).to.equal('http://example.com/blog - Endpoint 2');
      });
    });
  });
});
