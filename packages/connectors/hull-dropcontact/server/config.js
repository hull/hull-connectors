// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  return {
        handlers: handlers({ flow_in: 1, flow_size: 250, flow_in_time: 10000 }),
    timeout: 25000
  };
}
