import asyncMqtt from 'async-mqtt';
import { isString } from 'lodash-es';
import { unquote } from './helpers.js';
import { logger } from './logger.js';

let client;
let defaultQos;
let defaultRetain;

export async function connect(mqttOptions) {
  client = await asyncMqtt.connectAsync(mqttOptions);
  defaultQos = mqttOptions.qos || 0;
  defaultRetain = mqttOptions.retain || false;
}

export async function publish(
  topic,
  payload,
  { qos = defaultQos, retain = defaultRetain } = {}
) {
  const msg = unquote(isString(payload) ? payload : JSON.stringify(payload));
  logger.debug("Publishing to '%s':\n%o", topic, msg);
  client.publish(topic, msg, { qos, retain });
}
