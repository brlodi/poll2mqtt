import { flatten, pick } from 'lodash-es';
import { mergeQueryParams, mergeUrls } from './url.js';

function getFullyQualifiedEndpointName(svc, ep) {
  return [
    svc.name || svc.url,
    ep.name || ep.url || `Endpoint ${svc.endpoints.indexOf(ep) + 1}`,
  ].join(' - ');
}

function resolveEndpoint(service, endpoint) {
  const result = {
    name: getFullyQualifiedEndpointName(service, endpoint),
    url: mergeUrls(service.url, endpoint.url),
    query: mergeQueryParams(service.query, endpoint.query),
    interval: endpoint.interval || service.interval,
    topics: endpoint.topics || [pick(endpoint, 'topic', 'path')],
  };
  return result;
}

export function flattenServices(services) {
  return flatten(
    services.map((srv) => srv.endpoints.map((ep) => resolveEndpoint(srv, ep)))
  );
}
