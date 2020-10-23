/* @flow */
/* eslint-disable no-nested-ternary */
/* :: export type * from "hull-client"; */
/* :: export type * from "./types"; */

import HullClient from "hull-client";
import type { HullConnectorConfig } from "./types/connector";

import destinationConnectorFactory from "./connector/destination-connector";
import sourceConnectorFactory from "./connector/source-connector";
import bidirectionalConnectorFactory from "./connector/bidirectional-connector";

export type { HullConnectorConfig };

export { default as Client } from "hull-client";
export const Connector = bidirectionalConnectorFactory(HullClient);
export const sourceConnector = sourceConnectorFactory(HullClient);
export const destinationConnector = destinationConnectorFactory(HullClient);
