import pino from 'pino';
import { inspect } from 'util';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
logger.debugObject = (obj, colors = true) =>
  logger.debug('\n%s', inspect(obj, { depth: Infinity, colors }));
