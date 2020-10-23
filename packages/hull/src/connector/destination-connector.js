// @flow

import Connector from "./hull-connector";
import Worker from "./worker";

import type { HullConnectorConfig } from "../types/connector";

export default HullClient => {
  return (connectorConfig: { ...HullConnectorConfig }) =>
    new Connector(
      {
        Worker,
        Client: HullClient
      },
      connectorConfig
    ).start();
};
