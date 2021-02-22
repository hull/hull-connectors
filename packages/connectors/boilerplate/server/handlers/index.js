// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import statusCheck from "./status";

const handlers = () => (_connector: Connector): HullHandlersConfiguration => {
  return {
    statuses: { statusCheck },
    incoming: {},
    tabs: {},
    batches: {},
    subscriptions: {},
    json: {}
  };
};

export default handlers;
