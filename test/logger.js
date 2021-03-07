import { expect } from 'chai';
import { logger } from '../src/logger.js';

describe('logger', function () {
  it('is a Pino instance', function () {
    expect(logger).to.have.property('trace').that.is.a('function');
    expect(logger).to.have.property('debug').that.is.a('function');
    expect(logger).to.have.property('info').that.is.a('function');
    expect(logger).to.have.property('warn').that.is.a('function');
    expect(logger).to.have.property('error').that.is.a('function');
    expect(logger).to.have.property('fatal').that.is.a('function');
    expect(logger).to.have.property('silent').that.is.a('function');
    expect(logger).to.have.property('child').that.is.a('function');
    expect(logger).to.have.property('bindings').that.is.a('function');
    expect(logger).to.have.property('flush').that.is.a('function');
    expect(logger).to.have.property('level').that.is.a('string');
    expect(logger).to.have.property('levelVal').that.is.a('number');
    expect(logger).to.have.property('levels').that.is.an('object');
  });

  describe('debugObject()', function () {
    it('exists', function () {
      expect(logger).to.have.property('debugObject').that.is.a('function');
    });

    it('logs an object to console at debug level');
  });
});
