// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { FLOW_CONTROL_IN, FLOW_CONTROL_SIZE } = process.env;

  return {
    manifest,
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 200,
      flow_in: FLOW_CONTROL_IN || 1
    }),
    middlewares: [],
    cacheConfig: {
      ...cacheConfig,
      ttl: SHIP_CACHE_TTL || 60,
      max: SHIP_CACHE_MAX || 100
    },
    logsConfig: {
      logLevel: LOG_LEVEL
    },
    clientConfig: {
      firehoseUrl: OVERRIDE_FIREHOSE_URL
    },
    serverConfig: {
      start: true
    }
  };
}
