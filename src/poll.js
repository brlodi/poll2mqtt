import { get, includes, inRange, truncate } from 'lodash-es';
import { getJson } from './http.js';
import { logger } from './logger.js';
import { publish } from './mqtt.js';

const allowRetryOnError = ['ECONNRESET', 'ETIMEDOUT'];
const lastPollResult = new Map();

function shouldRetry(url) {
  // We assume previous success if this is our first time fetching `url`
  const lastResponse = lastPollResult.get(url.toString()) ?? 200;
  logger.debug(`lastStatus = ${lastResponse}`);
  return typeof lastResponse === 'string'
    ? includes(allowRetryOnError, lastResponse)
    : inRange(lastResponse, 200, 400);
}

export async function poll2Topics(url, query, topics, retain, qos, forcePoll) {
  const fetchUrl = new URL(url);
  fetchUrl.search = new URLSearchParams(query);

  if (!shouldRetry(fetchUrl)) {
    const lastStatus = lastPollResult.get(url.toString());
    if (forcePoll) {
      logger.info(
        `Got ${lastStatus} on last attempt to get ${fetchUrl}, trying again anyway. [forcePoll = true]`
      );
    } else {
      logger.info(
        `Got ${lastStatus} on last attempt to get ${fetchUrl}, skipping.`
      );
      return;
    }
  }

  let response;
  try {
    response = await getJson(fetchUrl);
  } catch (err) {
    logger.error(
      `Failed to fetch resource at '${url}': ${err.code} ${err.message}`
    );
    lastPollResult.set(fetchUrl.toString(), err.code);
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
      const responseStr = truncate(JSON.stringify(response), { length: 40 });
      logger.warn(`Path '${path}' not found in response object ${responseStr}`);
      logger.warn(response);
    }
  }
}
