import { expect } from 'chai';
import { cloneDeep } from 'lodash-es';
import mockFs from 'mock-fs';
import { getConfig } from '../src/config.js';

const baseArgv = ['node', 'src/index.js'];
const expectedConfigStandard = {
  minInterval: 3,
  mqtt: {
    hostname: 'mqtt.example.com',
    port: 1884,
    qos: 2,
    username: 'foo',
    password: 'secretpasswordshhh',
  },
  services: [
    {
      name: 'Example API',
      url: 'http://example.com/api',
      interval: 30,
      endpoints: [
        {
          name: 'Foo',
          url: 'foo',
          topic: 'poll2mqtt/foo',
        },
        {
          name: 'Bar',
          url: 'bar',
          force: true,
          topics: [
            {
              path: 'data.value',
              topic: 'poll2mqtt/bar',
            },
            {
              path: 'data.last_updated',
              topic: 'poll2mqtt/bar/last-update',
            },
          ],
        },
      ],
    },
  ],
};
const expectedConfigCustom = {
  minInterval: 7,
  mqtt: {
    hostname: 'example.net',
    port: 1234567,
    qos: 0,
  },
  services: [
    {
      name: 'Example API',
      url: 'http://example.com/api',
      interval: 10,
      endpoints: [
        {
          name: 'Foo',
          url: 'foo',
          topic: 'poll2mqtt/foo',
        },
        {
          name: 'Bar',
          url: 'bar',
          force: true,
          topics: [
            {
              path: 'data.value',
              topic: 'poll2mqtt/bar',
            },
            {
              path: 'data.last_updated',
              topic: 'poll2mqtt/bar/last-update',
            },
          ],
        },
      ],
    },
  ],
};

describe('config', function () {
  beforeEach(async function () {
    this.oldProcessEnv = cloneDeep(process.env);
  });

  afterEach(function () {
    process.env = cloneDeep(this.oldProcessEnv);
    mockFs.restore();
  });

  describe('can read both YAML and JSON config files', function () {
    it('loads config from a YAML file with `.yaml` extension', function () {
      mockFs({ 'config.yaml': mockFs.load('test/fixtures/config.yaml') });
      const actualConfig = getConfig(
        baseArgv.concat('--config', 'config.yaml')
      );
      return expect(actualConfig).to.eventually.deep.own.include(
        expectedConfigStandard
      );
    });

    it('loads config from a YAML file with `.yml` extension', function () {
      mockFs({ 'config.yml': mockFs.load('test/fixtures/config.yaml') });
      const actualConfig = getConfig(baseArgv.concat('--config', 'config.yml'));
      return expect(actualConfig).to.eventually.deep.own.include(
        expectedConfigStandard
      );
    });

    it('loads config from a JSON file', function () {
      mockFs({ 'config.json': mockFs.load('test/fixtures/config.json') });
      const actualConfig = getConfig(
        baseArgv.concat('--config', 'config.json')
      );
      return expect(actualConfig).to.eventually.deep.own.include(
        expectedConfigStandard
      );
    });
  });

  it('loads config from the specified path', function () {
    mockFs({
      '/some/custom/config': mockFs.load('test/fixtures/custom-config.yaml'),
    });
    const actualConfig = getConfig(
      baseArgv.concat('--config', '/some/custom/config')
    );
    return expect(actualConfig).to.eventually.deep.own.include(
      expectedConfigCustom
    );
  });

  it('loads config from one of the default paths if none specified', function () {
    const expectations = [];
    mockFs({ 'config.json': mockFs.load('test/fixtures/config.json') });
    expectations.push(
      expect(getConfig(baseArgv)).to.eventually.deep.own.include(
        expectedConfigStandard
      )
    );
    mockFs({ 'config.yml': mockFs.load('test/fixtures/config.yaml') });
    expectations.push(
      expect(getConfig(baseArgv)).to.eventually.deep.own.include(
        expectedConfigStandard
      )
    );
    mockFs({ 'config.yaml': mockFs.load('test/fixtures/config.yaml') });
    expectations.push(
      expect(getConfig(baseArgv)).to.eventually.deep.own.include(
        expectedConfigStandard
      )
    );
    return Promise.all(expectations);
  });

  it.skip("overrides config file values with ENV vars\n\tSKIP REASON: yargs reads env vars immediately the first time it is imported, and the official\n\tworkaround involves require() which can't be used in this ESM context", function () {
    process.env.POLL2MQTT_MIN_INTERVAL = '967';
    process.env.POLL2MQTT_MQTT__HOSTNAME = 'www.example.net';
    process.env.POLL2MQTT_MQTT__QOS = '1';
    mockFs({
      '/some/custom/config': mockFs.load('test/fixtures/custom-config.yaml'),
    });
    const actualConfig = getConfig(
      baseArgv.concat('--config', '/some/custom/config')
    );
    return Promise.all([
      expect(actualConfig).to.eventually.have.property('minInterval', 967),
      expect(actualConfig).to.eventually.have.nested.property(
        'mqtt.hostname',
        'www.example.net'
      ),
      expect(actualConfig).to.eventually.have.nested.property('mqtt.qos', 1),
    ]);
  });

  it.skip("overrides config values and ENV vars with command line arguments\n\tSKIP REASON: yargs reads env vars immediately the first time it is imported, and the official\n\tworkaround involves require() which can't be used in this ESM context", function () {
    process.env.POLL2MQTT_MIN_INTERVAL = '967';
    process.env.POLL2MQTT_MQTT__HOSTNAME = 'www.example.net';
    process.env.POLL2MQTT_MQTT__QOS = '1';
    mockFs({
      '/some/custom/config': mockFs.load('test/fixtures/custom-config.yaml'),
    });
    const actualConfig = getConfig(
      baseArgv.concat(
        '--min-interval',
        '1313',
        '--config',
        '/some/custom/config',
        '--mqtt.hostname',
        'mqtt.example.net'
      )
    );
    return Promise.all([
      expect(actualConfig).to.eventually.have.property('minInterval', 1313),
      expect(actualConfig).to.eventually.have.nested.property(
        'mqtt.hostname',
        'mqtt.example.net'
      ),
      expect(actualConfig).to.eventually.have.nested.property('mqtt.qos', 1),
    ]);
  });
});
