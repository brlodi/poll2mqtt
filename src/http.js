import fetch from 'node-fetch';
import { logger } from './logger.js';

export async function getJson(url) {
  logger.debug(`Fetching ${url}...`);

  const response = await fetch(url);

  if (!response.ok) {
    const err = new Error(response.statusText);
    err.code = response.status;
    throw err;
  }

  return response.json();
}
