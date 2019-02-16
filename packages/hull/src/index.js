/* @flow */
/* :: export type * from "hull-client"; */
/* :: export type * from "./types"; */

import HullClient from "hull-client";
import type { HullConnectorConfig } from "./types";

const Worker = require("./connector/worker");
const ConnectorClass = require("./connector/hull-connector");

export { default as Client } from "hull-client";
export class Connector extends ConnectorClass {
  config: HullConnectorConfig;

  constructor(connectorConfig: HullConnectorConfig) {
    super(
      {
        Worker,
        Client: HullClient
      },
      connectorConfig
    );
  }
}

const Hull = {
  Client: HullClient,
  Connector
};

export default Hull;
