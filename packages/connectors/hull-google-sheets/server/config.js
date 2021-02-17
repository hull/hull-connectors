// @flow

import type { HullConnectorConfig } from "hull";
import handlers from "./handlers";

export default function connectorConfig(): HullConnectorConfig {
  const { INSTALL_URL } = process.env;

  if (!INSTALL_URL) {
    throw new Error("Missing INSTALL_URL environment variable");
  }

  return {
    handlers: handlers({
      installUrl: INSTALL_URL
    }),
    middlewares: []
  };
}
