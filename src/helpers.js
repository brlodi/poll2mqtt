import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { inspect } from 'util';

export function getDirname(importMetaUrl) {
  return fileURLToPath(dirname(importMetaUrl));
}

export function printObject(object) {
  // eslint-disable-next-line no-console
  console.log(inspect(object, { depth: Infinity, colors: true }));
}

export function unquote(str) {
  return str.match(/^(["'])(?<content>.*)\1$/)?.groups?.content ?? str;
}
