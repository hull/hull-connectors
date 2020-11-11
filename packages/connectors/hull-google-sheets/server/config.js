// import Hull from "hull";
// import app from "./app";
//
// const options = {
//   Hull,
//   skipSignatureValidation: true,
//   installUrl: process.env.INSTALL_URL
// };
//
// const connector = new Hull.Connector(options);
// connector.startApp(app(connector, options));
//
//
//

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
