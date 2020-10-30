// @flow

import type { HullConnectorConfig } from "hull";
import fetchToken from "./lib/fetch-token";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  return {
        handlers: handlers(),
    middlewares: [fetchToken]
  };
}
