// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  return {
    handlers
  };
}
