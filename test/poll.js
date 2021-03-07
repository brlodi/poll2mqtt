import { poll2Topics } from '../src/poll.js'; // eslint-disable-line no-unused-vars

describe('poll', function () {
  describe('poll2Topics()', function () {
    it('successfully polls an endpoint and publishes the result to MQTT');
    it('publishes only the specified JSON fragment to each topic');
    it('does not poll an endpoint with a non-transient error on last poll');
    it('allows overriding retry prevention');
  });
});
