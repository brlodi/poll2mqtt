#!/usr/bin/env node

import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { inspect } from 'util';
import { resolve } from 'path';
import mqtt from 'async-mqtt';
import { load } from 'js-yaml';
import { has, get, max, merge } from 'lodash-es';
import fetch from 'node-fetch';
import pino from 'pino';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function loadConfigYaml(path) {
  try {
    return load(readFileSync(resolve(path), { encoding: 'utf-8' }));
  } catch (error) {
    logger.error('Failed to read configuration file at %s.', resolve(path));
    return undefined;
  }
}

function buildUrl(urls, params) {
  const url = urls.reduce((acc, cur) => new URL(cur, acc));
  url.search = new URLSearchParams(merge({}, ...params)).toString();
  return url;
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    logger.error(error);
    return undefined;
  }
  if (!response.ok) {
    logger.error(response);
    return undefined;
  }

  try {
    return await response.json();
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}

async function publish(client, topic, json, path) {
  if (!path) {
    logger.debug('Publishing to %s: %o', topic, json);
    return client.publish(topic, JSON.stringify(json));
  }

  const payload = get(json, path);
  if (!has(json, path)) {
    logger.warn("Path '%s' not found in response: %o", path, payload);
  }
  logger.debug('Publishing to %s: %o', topic, payload);
  return client.publish(topic, JSON.stringify(payload));
}

async function poll(client, url, topics) {
  const json = await fetchJson(url);
  if (!json) {
    logger.warn('Failed to fetch %s. Skipping publish.', url);
    return;
  }
  for (const { topic, path } of topics) {
    publish(client, topic, json, path);
  }
}

let yargsParser = yargs(hideBin(process.argv))
  .strictCommands() // Disallow non-explicitly-defined positional commands
  .env('POLL2MQTT') // Also read environment vars starting with 'POLL2MQTT_'
  .config('config', 'Path to YAML configuration file', loadConfigYaml)
  .option('min-interval', {
    coerce: (v) => max([1, v]), // Under no circumstances poll at > 1Hz
    default: 10,
    description:
      'Minimum allowed interval (in seconds) between polls of a single endpoint',
    type: 'number',
  })
  .option('mqtt.hostname', {
    default: 'localhost',
    type: 'string',
  })
  .option('mqtt.port', {
    default: 1883,
    type: 'number',
  })
  .option('mqtt.username', { type: 'string' })
  .option('mqtt.password', { type: 'string' })
  .option('mqtt.qos', {
    choices: [0, 1, 2],
    default: 1,
    type: 'number',
  })
  .option('user-agent', {
    default: `poll2mqtt-${randomBytes(8).toString('hex')}`,
    defaultDescription: 'randomly-generated string',
    description: 'User-Agent string to send with requests',
    type: 'string',
  });

// Load default config file if none passed
if (!yargsParser.argv.config) {
  yargsParser = yargsParser.config(loadConfigYaml('config.yaml'));
}

const config = yargsParser.argv;
logger.debug(
  'Using configuration: %s',
  inspect(config, { depth: Infinity, colors: true })
);
yargsParser = null;

let mqttClient;
try {
  mqttClient = await mqtt.connectAsync(config.mqtt);
} catch (error) {
  logger.error(error);
  process.exit(111);
}

for (const service of config.services) {
  for (const endpoint of service.endpoints) {
    const url = buildUrl(
      [service.url, endpoint.url],
      [service.query, endpoint.query]
    );
    const interval = max([
      config.minInterval,
      endpoint.interval || service.interval,
    ]);
    const topics = endpoint.topics || [endpoint];

    const fn = poll.bind(this, mqttClient, url, topics);

    logger.info(
      'Polling %s every %ds and publishing to %o',
      url,
      interval,
      topics.map((t) => t.topic).join(', ')
    );

    fn();
    setInterval(fn, interval * 1000);
  }
}
