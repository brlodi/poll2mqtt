# poll2mqtt

**Lightweight microservice to periodically fetch data from HTTP APIs and dump it onto an MQTT broker.**

Sometimes you just want the data from an HTTP endpoint available in your MQTT broker. Sure you could probably set up the consuming services and devices to directly access the endpoint, but that's a lot of duplicated calls when you already have a pub-sub system up and running. Enter poll2mqtt.

## Installation

### Docker

poll2mqtt is designed primarily to run as a minimal Docker container. The easiest approach is to just bind-mount your [config file](#configuration) to `/home/node/app/config.yaml` and start the container.

```sh
docker run -it -v "$PWD/config.yaml:/home/node/app/config.yaml:ro" poll2mqtt
```

Or using Docker Compose:

```yaml
services:
  poll2mqtt:
    image: brlodi/poll2mqtt:latest
    volumes:
      - './config.yaml:/home/node/app/config.yaml:ro'
      - '/etc/localtime:/etc/localtime:ro' # Set the timezone in the container
```

You can pass configuration via environment variables too (see [below](#environment-variables) for specifics):

```yaml
services:
  mypoller:
    image: brlodi/poll2mqtt:latest
    volumes:
      - './config.yaml:/home/node/app/config.yaml:ro'
      - '/etc/localtime:/etc/localtime:ro' # Set the timezone in the container
    environment:
      - POLL2MQTT_USER_AGENT=mypoller
      - POLL2MQTT_MQTT__PASSWORD=supersecretpassword
```

### NPM

poll2mqtt is also available as a CLI via the NPM registry. Just run

```sh
npm install -g poll2mqtt
```

or

```sh
yarn global add poll2mqtt
```

## Configuration

The primary way to configure poll2mqtt is by creating a `config.yaml` file in your working directory:

```yaml
# Example config
user-agent: my-app

mqtt:
  hostname: mqtt.example.com
  port: 1883
  username: myapp
  password: supersecretpassword
  qos: 2

min-interval: 10 # seconds

services:
  - name: Weather
    url: https://api.example.com/weatherapi/
    query:
      lat: 34.5678
      lon: -100.1234
    interval: 600 # 10 minutes
    endpoints:
      - name: Current Conditions
        url: current # resolves to https://api.example.com/weatherapi/current?lat=34.5678&lon=-100.1234
        topics:
          - topic: weather
            path: 'data.current_conditions'
          - topic: weather/temperature
            path: 'data.current_conditions.air_temperature'
          - topic: weather/humidity
            path: 'data.current_conditions.relative_humidity'
          - topic: weather/uv
            path: 'data.current_conditions.ultraviolet_index'
          - topic: weather/dewpoint
            path: 'data.current_conditions.dew_point_temperature'
      - name: Tomorrow's Forecast
        url: forecast
        query:
          resolution: daily
        # resolves to https://api.example.com/weatherapi/forecast?lat=34.5678&lon=-100.1234&resolution=daily
        topic: weather/tomorrow
        path: 'data[0]'
        interval: 43200 # 12 hours
      - name: Completely different URL
        url: http://www.example.com/oldapi/v1/weather-alerts
        query:
          lat: null
          lon: null
          coords: 34.5678,-100.1234
        # resolves to http://www.example.com/oldapi/v1/weather-alerts?coords=34.5678,-100.1234
        topic: weather/alerts
```

You can also pass any of these configuration options on the command line or via environment variables, e.g.:

```sh
POLL2MQTT_MQTT__PASSWORD=foo poll2mqtt --mqtt.hostname mqtt.example.com --min-interval 20
```

Technically yoou could even define services and endpoints this way, although we recommend against that. Just use a config file!

### Configuration Options

Options are given in the following format: `yaml-key` (`cli-arg` | `ENV_VAR`).

#### `mqtt`

If username and password are not provided, poll2mqtt will attempt to connect anonymously, which your broker may or may not allow.

##### `hostname` (`--mqtt.hostname` | `POLL2MQTT_MQTT__HOSTNAME`)

**default**: localhost

##### `port` (`--mqtt.port` | `POLL2MQTT_MQTT__PORT`)

**default**: 1883 (the standard MQTT port)

##### `username` (`--mqtt.username` | `POLL2MQTT_MQTT__USERNAME`)

**default**: undefined

##### `password` (`--mqtt.password` | `POLL2MQTT_MQTT__PASSWORD`)

**default**: undefined

#### `min-interval` (`--min-interval` | `POLL2MQTT_MIN_INTERVAL`)

**default**: 10

The minimum interval (in seconds) at which poll2mqtt is allowed to poll any given endpoint. This will override any shorter endpoint-specific settings.

**NOTE:** poll2mqtt enforces a minimum interval of 1s. _This will not be changed_.

#### `user-agent` (`--user-agent` | `POLL2MQTT_USER_AGENT`)

**default**: [randomly generated string]

The user-agent string to send with HTTP requests. We politely ask that you set this to something you've defined, but if you don't a random string will be generated (e.g. `poll2mqtt-5bd21f3cd5f94ba9`)

#### `services`

An array of service definitions in the following format:

##### `name` (optional)

A human-friendly identifier for this service.

##### `url`

The base URL of this service. Endpoint URLs will be appended to this URL unless they are an absolute URL on their own.

##### `query`

A map of query parameters to be sent as the query string with requests.

Example:

```yaml
url: http://api.example.com/foo
query:
  cat: plz
  sort: desc
  limit: 10
  apiKey: 5b3cd5fd2195bd21f94baf3cd5f94ba9
```

will result in a request to `http://api.example.com/foo?cat=plz&sort=desc&limit=10&apiKey=5b3cd5fd2195bd21f94baf3cd5f94ba9`.

You can also override and supply additional query parameters for each specific endpoint (see below).

##### `interval`

**default**: `min-interval`

The interval (in seconds) between polls of this service. If set to a value less than `min-interval`, `min-interval` will be used instead.

Individual endpoints can override this setting to be polled faster _or_ slower.

#### `endpoints`

An array of endpoints for the given service, in the following format:

<!-- markdownlint-disable-next-line MD024 -->

##### `name` (optional)

A human-friendly identifier for this endpoint.

<!-- markdownlint-disable-next-line MD024 -->

##### `url`

Either a path relative to the service URL, or a complete URL (including protocol) to be used _instead_ of the service's URL.

Example:

```yaml
services:
  - name: Foo
    url: http://www.example.com/api
    endpoints:
      - name: Bar
        url: bar # becomes http://www.example.com/api/bar
      - name: Baz
        url: http://baz.example.com/apiv2 # used as-is
```

<!-- markdownlint-disable-next-line MD024 -->

##### `query`

A map of query parameters which will be _merged_ with the service-level query parameters. To omit a key without providing a new value, set it to `null`.

Example:

```yaml
services:
  - name: Foo
    query:
      apiKey: qwertyuiop0987654321
      user: alice
    endpoints:
      - name: Bar
        # this will result in a query string of `?user=bill&apiKey=qwertyuiop0987654321`
        query:
          user: bill
      - name: Baz
        # this will result in a query string of `?user=alice&limit=10`
        query:
          apiKey: null
          limit: 10
```

##### `interval` (optional)

Optionally, override the polling interval for this particular endpoint. Especially useful for slowing down polling of those endpoints you know serve stable data, or conversely for speeding up polling of a single endpoint (like the health check) on an otherwise response-stable API.

##### `topic`

The MQTT topic to publish the API response to. The entire response will be posted (as a JSON string) unless you define [`path`](#path) below.

##### `path`

A path string to extract a value from the response and use it as the value to publish over MQTT, instead of publishing the whole JSON response.

For example, given this API response:

```json
{
    "meta": {
        "date": "2021-01-19T12:34:56.789Z"
    }
    "data": {
        "activeUsers": 27,
        "systemLoad": [1.02, 0.76, 0.55]
    }
}
```

setting the path to `data.activeUsers` would publish `27` to the MQTT topic, and a path of `data.systemLoad[0]` would publish `1.02` to the topic.

##### `topics`

Instead of defining a single topic and path, you can instead pass an array of `topic`/`path` pairs. This lets you split a single API response onto multiple topics without having to query the endpoint multiple times.

**NOTE:** If both the standalone options and the `topics` array are provided, the `topics` array will be used.

Example:

```yaml
endpoints:
  - name: Current Conditions
  url: current
  topics:
    - topic: weather/temperature
      path: "data.current_conditions.air_temperature"
    - topic: weather/humidity
      path: "data.current_conditions.relative_humidity"
```
