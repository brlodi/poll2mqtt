#!/usr/bin/env node

import { getConfig } from './config.js';
import { flattenServices } from './endpoints.js';
import { printObject } from './helpers.js';
import { logger } from './logger.js';
import * as mqtt from './mqtt.js';
import { poll2Topics } from './poll.js';

const config = await getConfig();
if (config.printConfig) {
  printObject(config);
  process.exit(0);
}

try {
  await mqtt.connect(config.mqtt);
} catch (err) {
  logger.error(
    err,
    'Failed to connect to MQTT broker at %s:%s',
    config.mqtt.hostname,
    config.mqtt.port
  );
  process.exit(1);
}

const endpoints = flattenServices(config.services);

for (const endpoint of endpoints) {
  const pollFn = () =>
    poll2Topics(
      endpoint.url,
      endpoint.query,
      endpoint.topics,
      config.mqtt.retain,
      config.mqtt.qos,
      endpoint.force
    );
  pollFn();
  setInterval(pollFn, endpoint.interval * 1000);
}
