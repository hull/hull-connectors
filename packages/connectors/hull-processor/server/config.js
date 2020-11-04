// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { FLOW_CONTROL_IN, FLOW_CONTROL_SIZE } = process.env;

  return {
    handlers: handlers({
      flow_size: parseInt(FLOW_CONTROL_SIZE, 10) || 200,
      flow_in: parseInt(FLOW_CONTROL_IN, 10) || 1
    })
  };
}
