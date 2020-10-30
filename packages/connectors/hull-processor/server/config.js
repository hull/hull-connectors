// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { FLOW_CONTROL_IN, FLOW_CONTROL_SIZE } = process.env;

  return {
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE || 200,
      flow_in: FLOW_CONTROL_IN || 1
    })
  };
}
