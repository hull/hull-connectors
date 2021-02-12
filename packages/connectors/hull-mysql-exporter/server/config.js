// @flow

import type { HullConnectorConfig } from "hull";
import { handler } from "hull-sql-exporter";
import * as adapter from "./lib/adapter";

export default function connectorConfig(): HullConnectorConfig {
  const { CACHE_MAX_ENTRIES } = process.env;

  return {
    handlers: handler(adapter),
    cacheConfig: {
      max: CACHE_MAX_ENTRIES || 100
    }
  };
}
