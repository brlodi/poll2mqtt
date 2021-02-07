import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import mqtt from 'async-mqtt';
import { load } from 'js-yaml';
import { has, get, max, merge } from 'lodash-es';
import fetch from 'node-fetch';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function loadConfigYaml(path) {
  try {
    return load(readFileSync(resolve(path), { encoding: 'utf-8' }));
  } catch (error) {
    console.error(`Failed to read configuration file at '${resolve(path)}'.`);
    return undefined;
  }
}

function buildUrl(urls, params) {
  const url = urls.reduce((acc, cur) => new URL(cur, acc));
  url.search = new URLSearchParams(merge({}, ...params)).toString();
  return url;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status < 200 || response.status >= 400) {
    console.error(
      `Error polling ${url}. The endpoint responded with ${response.status} - ${response.statusText}`
    );
    return undefined;
  }
  const json = await response.json();
  if (!json) {
    console.error(
      `Error polling ${url}. The endpoint returned an invalid response. Are you sure it returns a JSON document?`
    );
    return undefined;
  }
  return json;
}

async function publish(client, topic, json, path) {
  if (!path) {
    const payload = JSON.stringify(json);
    console.debug(`Publishing ${payload} on topic '${topic}'`);
    return client.publish(topic, payload);
  }

  const payload = JSON.stringify(get(json, path));
  if (!has(json, path)) {
    console.warn(`${path} not found in response ${payload}`);
  }
  console.debug(`Publishing ${payload} on topic '${topic}'`);
  return client.publish(topic, payload);
}

async function poll(client, url, topics) {
  const response = await fetchJson(url);
  for (const { topic, path } of topics) {
    publish(client, topic, response, path);
  }
}

let yargsParser = yargs(hideBin(process.argv))
  .env('HTTP2MQTT') // Also read environment vars starting with 'HTTP2MQTT_'
  .config('config', loadConfigYaml)
  .option('min-interval', {
    coerce: (v) => max([1, v]), // Under no circumstances poll at > 1Hz
    default: 10,
    type: 'number',
  })
  .option('mqtt', {
    default: {
      hostname: 'localhost',
      port: 1883,
      username: undefined,
      password: undefined,
    },
  })
  .option('mqtt.qos', {
    choices: [0, 1, 2],
    default: 1,
    type: 'number',
  })
  .option('user-agent', {
    default: `http2mqtt-${randomBytes(8).toString('hex')}`,
  });

// Load default config file if none passed
if (!yargsParser.argv.config) {
  yargsParser = yargsParser.config(loadConfigYaml('config.yaml'));
}

const config = yargsParser.argv;

let mqttClient;
try {
  mqttClient = await mqtt.connectAsync(config.mqtt);
} catch (error) {
  console.error(error);
  process.exit(111);
}

let requestCounter = 0;
for (const service of config.services) {
  for (const endpoint of service.endpoints) {
    requestCounter += 1;
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

    // Stagger initial call
    setTimeout(fn, 10 * requestCounter);
    setInterval(fn, interval * 1000);
  }
}
