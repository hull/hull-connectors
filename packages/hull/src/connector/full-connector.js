// @flow

import ConnectorClass from "./hull-connector";
import Worker from "./worker";

import type { HullConnectorConfig } from "../types/connector";

export default HullClient =>
  class Connector extends ConnectorClass {
    config: HullConnectorConfig;

    constructor(
      connectorConfig: HullConnectorConfig | (() => HullConnectorConfig)
    ) {
      // Here we do all the changes required to provide
      // default values that don't need configuration to create the destination connector

      super(
        {
          Worker,
          Client: HullClient
        },
        connectorConfig
      );
    }
  };
