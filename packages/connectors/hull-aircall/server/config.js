// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import fetchToken from "./lib/fetch-token";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  return {
    manifest,
    handlers: handlers(),
    middlewares: [fetchToken],
    cacheConfig: {
      store: "memory",
      ttl: 1
    }
  };
}
