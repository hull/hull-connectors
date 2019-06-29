## consolidated `server`

This system has the objective of progressively DRY'ing the different implementations of the express server we use in connectors.

The implementation is as follows:

### `package/server/index.js`

Start it with an object conforming to the flow type `HullConnectorConfig`

```js
type HullConnectorConfig = {
  clientConfig: HullClientConfig,
  hostSecret: ?string,
  port: number | string,
  connectorName?: string,
  segmentFilterSetting?: any,
  skipSignatureValidation?: boolean,
  timeout?: number | string,
  captureMetrics?: Array<Object>,
  captureLogs?: Array<any>,
  disableOnExit?: boolean,
  devMode?: boolean,
  json?: JsonConfig,
  instrumentation?: HullInstrumentation,
  cache?: HullCache,
  queue?: HullQueue,
  notificationValidatorHttpClient?: Object,
  middlewares: Array<Middleware>,
  manifest: HullManifest
};
```

Here's a short recap of the parameters format and behaviour:


#### clientConfig: HullClientConfig,
- Required
- default: { }

#### hostSecret: ?string,
- Required
- format: string
- a random generated secret

#### port: number | string
- Required
- the port on which to listen to

#### connectorName
- Optional
- format: string
- A human-readable name for the connector (for the Logs)
- default: automatic

#### segmentFilterSetting
- Optional
- format: any
- default false

#### skipSignatureValidation
- Optional
- format: boolean
- default: false

#### timeout
- Optional
- format: number | string
- default: 25s

#### captureMetrics
- Optional
- format: Array<Object>,
- an array to populate with metrics

#### captureLogs
- Optional
- format: Array<any>,
- an array to populate with the logs

#### disableOnExit
- Optional
- format: boolean,

#### devMode
- Optional
- format: boolean,
- if `devMode` is true, start the server in development mode, adding `webpack` to the mix and switching to verbose errors

#### json
- Optional
- format: JsonConfig,
- A configuration object for the express json parser. (https://expressjs.com/en/api.html#express.json)
- default: `{ limit: "10mb" }`

#### instrumentation
- Optional
- format: HullInstrumentation,

#### queue
- Optional
- format: Hull Queue,
`const { Queue } = require("hull/src/infra");`

#### notificationValidatorHttpClient
- Optional
- format: Object,
- used for Tests

#### middlewares: Array<Middleware>,
- Required
- an array of `express` middlewares that will be applied after all the other middlewares

#### manifest: HullManifest
- required
- the connector's manifest.

```js
import manifest from "../manifest.json";
```

Calling the `server` method Starts an express server and returns an object containing:

```js
{
  app //The Express server, a simple const app=express();
  server //The instantiated express server, listening on the port defined by connectorConfig.port
  connector //an instannce of new Hull.Connector()
}
```

Here's a minimal setup:

```js
// @flow
import Hull from "hull";
import type { HullConnectorConfig } from "../../../types";
import manifest from "../manifest.json";
import server from "../../../server"; //The standard server require
import configure from "./server"; //The connector's custom setup

const {
  SECRET = "1234",
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  REDIS_URL,
  PORT
} = process.env;

const connectorConfig: HullConnectorConfig = {
  manifest,
  devMode: NODE_ENV === "development",
  logLevel: LOG_LEVEL,
  hostSecret: SECRET || "1234",
  port: PORT || 8082,
  handlers: {},
  middlewares: [],
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

const { app, server, connector } = server({ Hull, connectorConfig }

configure({ app, server, connector }));

```
