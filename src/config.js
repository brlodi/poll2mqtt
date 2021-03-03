import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { resolve } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { logger } from './logger.js';

const DEFAULT_CONFIG_PATHS = ['config.yaml', 'config.yml', 'config.json'];

const ENV_PREFIX = 'POLL2MQTT_';
const ACCEPTED_OPTIONS = {
  config: {
    description:
      'Use specified config file instead of the one in the current directory',
    type: 'string',
  },
  'min-interval': {
    // Under no circumstances allow polling more than once per second
    coerce: (v) => Math.max(1, v),
    default: 10,
    description: 'Minimum time (in seconds) between polls of a single endpoint',
    type: 'number',
  },
  'mqtt.hostname': {
    default: 'localhost',
    group: 'MQTT Options',
    type: 'string',
  },
  'mqtt.port': {
    default: 1883,
    group: 'MQTT Options',
    type: 'number',
  },
  'mqtt.username': {
    group: 'MQTT Options',
    type: 'string',
  },
  'mqtt.password': {
    group: 'MQTT Options',
    type: 'string',
  },
  'mqtt.qos': {
    choices: [0, 1, 2],
    default: 1,
    group: 'MQTT Options',
    type: 'number',
  },
  'print-config': {
    description: 'Print the resolved configuration and exit',
    type: 'boolean',
  },
  'user-agent': {
    defaultDescription: 'randomly string',
    description: 'User-Agent string to send with requests',
    type: 'string',
  },
};

function readDefaultConfigFile() {
  for (const path of DEFAULT_CONFIG_PATHS) {
    try {
      return readFileSync(resolve(path), 'utf-8');
    } catch (err) {
      logger.debug("Did not find config file at default '%s'", resolve(path));
    }
  }
  logger.warn('Failed to load configuration from default paths!');
  return '';
}

function readConfigFile(path) {
  if (!path) return readDefaultConfigFile();
  return readFileSync(resolve(path), 'utf-8');
}

export function parseConfig(path) {
  return load(readConfigFile(path));
}

export function getConfig() {
  let argParser = yargs(hideBin(process.argv))
    .parserConfiguration({
      'strip-aliased': true,
      'strip-dashed': true,
    })
    .env(ENV_PREFIX)
    .options(ACCEPTED_OPTIONS);

  // Yargs doesn't parse a config file if the option isn't passed explicitly,
  // but it *will* use a config object passed directly, so we parse the config
  // file ourselves and just pass the resulting object to Yargs
  argParser = argParser.config(parseConfig(argParser.argv.config));

  return argParser.argv;
}
