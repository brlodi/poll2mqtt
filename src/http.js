import fetch from 'node-fetch';
import { logger } from './logger.js';

export async function getJson(url) {
  logger.debug(`Fetching ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    logger.error(
      `Unable to fetch resource at '${url}'. The server responded with "${response.status} - ${response.statusText}"`
    );
    return undefined;
  }

  return response.json();
}
