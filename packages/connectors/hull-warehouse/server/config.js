// @flow

import type { HullConnectorConfig } from "hull";

const _ = require("lodash");
const HullRouter = require("hull-connector-framework/src/purplefusion/router");

export default function connectorConfig(): HullConnectorConfig {
  const { CACHE_MAX_ENTRIES } = process.env;

  return {
      handlers: new HullRouter({
      glue: require("./glue"),
      services: {
        postgres: require("./postgres-sequalize-service")()
      },
      transforms: require("./transforms-to-service"),
      ensureHook: "ensureHook"
    }).createHandler,
    cacheConfig: {
      max: CACHE_MAX_ENTRIES || 100,
    }
  };
}
