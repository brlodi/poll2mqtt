import { connect, publish } from '../src/mqtt.js'; // eslint-disable-line no-unused-vars

describe('mqtt', function () {
  describe('connect()', function () {
    it('connects to a MQTT broker that is currently up');
    it(
      'retries a reasonable number of times if the target MQTT broker is down'
    );
    it('throws a system error on network issue');
    it('sets the default message parameters upon successfull connection');
  });
  describe('publish()', function () {
    describe('publishes the passed payload on the given topic', function () {
      it('publishes string payloads without extra quotes');
      it('publishes number payloads as parseable strings');
      it('publishes object payloads serialized as JSON');
      it('uses the default retain and QoS settings if none specified');
      it('uses the specified retain and QoS settings');
    });
  });
});
