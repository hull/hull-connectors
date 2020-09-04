// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";
import authMiddleware from "./lib/segment-auth-middleware";

export default function connectorConfig(): HullConnectorConfig {
  const { FLOW_CONTROL_IN, FLOW_CONTROL_SIZE } = process.env;

  return {
    manifest,
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 100,
      flow_in: FLOW_CONTROL_IN || 10
    }),
    middlewares: [authMiddleware]
  };
}
