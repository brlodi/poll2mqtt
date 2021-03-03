import { merge, pickBy } from 'lodash-es';

function testRegex(regex) {
  return regex.test.bind(regex);
}

const startsWithSlash = testRegex(/^\//);
const endsWithSlash = testRegex(/\/$/);
export const isAbsoluteUrl = testRegex(/^\w+:\/\//);
export const isProtocolRelUrl = testRegex(/^\/\//);
export const endsWithFilePath = testRegex(
  /(?<!^((\w+:)?\/\/))(?<![\w.])\w+\.(\.?\w+)*$/
);

function normalizeTrailingSlash(path) {
  return endsWithSlash(path) || endsWithFilePath(path) ? path : `${path}/`;
}

export function mergeUrls(...urls) {
  if (!urls || urls.length < 1) throw new TypeError();
  if (urls.some(isProtocolRelUrl)) throw new TypeError();
  if (urls.length > 2) return mergeUrls(urls[0], mergeUrls(...urls.slice(1)));

  const [a, b] = urls.map(normalizeTrailingSlash);

  /* eslint-disable prefer-template */
  if (!b) return a;
  if (isAbsoluteUrl(b)) return b;
  if (isAbsoluteUrl(a) && startsWithSlash(b)) return new URL(a).origin + b;
  if (!isAbsoluteUrl(a) && startsWithSlash(b)) return b;
  if (endsWithSlash(a) && !startsWithSlash(b)) return a + b;
  if (endsWithSlash(a) && startsWithSlash(b)) return a + b.slice(1);
  return a + '/' + b;
  /* eslint-enable prefer-template */
}

export function mergeQueryParams(...paramsMaps) {
  return pickBy(merge({}, ...paramsMaps), (v) => v !== null);
}
