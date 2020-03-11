// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const {
    FLOW_CONTROL_IN = 1,
    FLOW_CONTROL_SIZE = 200
  } = process.env;

  return {
    manifest,
    handlers: handlers({
      flow_size: parseInt(FLOW_CONTROL_SIZE || 200, 10),
      flow_in: parseInt(FLOW_CONTROL_IN || 1, 10)
    })
  };
}
