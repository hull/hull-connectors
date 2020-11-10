/* @flow */
/* eslint-disable no-nested-ternary */
/* :: export type * from "hull-client"; */
/* :: export type * from "./types"; */

import HullClient from "hull-client";
import type { HullConnectorConfig } from "./types/connector";

import ConnectorFactory from "./connector/full-connector";

export type { HullConnectorConfig };

export { default as Client } from "hull-client";
export const Connector = ConnectorFactory(HullClient);
