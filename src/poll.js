import { get } from 'lodash-es';
import { getJson } from './http.js';
import { logger } from './logger.js';
import { publish } from './mqtt.js';

export async function poll2Topics(url, query, topics, retain, qos) {
  const fetchUrl = new URL(url);
  fetchUrl.search = new URLSearchParams(query);
  let response;
  try {
    response = await getJson(fetchUrl);
  } catch (err) {
    logger.error(err, `Failed to retrieve ${fetchUrl}`);
    return;
  }

  for (const { topic, path } of topics) {
    const payload = get(response, path);

    if (payload) {
      try {
        publish(topic, payload, { retain, qos });
      } catch (err) {
        logger.error(err, `Failed to publish to topic '${topic}`);
      }
    } else {
      logger.warn(
        `Path '${path}' not found in response object ${JSON.stringify(
          response
        )}`
      );
    }
  }
}
