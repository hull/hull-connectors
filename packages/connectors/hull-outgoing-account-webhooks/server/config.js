// @flow

import type { HullConnectorConfig } from "hull";
import manifest from "../manifest.json";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { FLOW_CONTROL_IN, FLOW_CONTROL_SIZE } = process.env;

  return {
    manifest,
    handlers: handlers({
      flow_size: FLOW_CONTROL_SIZE,
      flow_in: FLOW_CONTROL_IN
    }),
    httpClientConfig: {
      throttle: false // disable generic throttling as it is handled by the connector
    }
  };
}
