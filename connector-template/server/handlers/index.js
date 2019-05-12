// @flow
/* eslint-disable global-require */
import type { HullHandlersConfiguration, Connector } from "hull";
import userUpdate from "./user-update";
import statusHandler from "./status";

const handlers = () => (connector: Connector): HullHandlersConfiguration => {
  const { connectorConfig } = connector;
  /* eslint-disable-next-line no-unused-vars */
  const { hostSecret, port, devMode } = connectorConfig;

  return {
    statuses: {
      statusHandler
    },
    schedules: {},
    subscriptions: {
      userUpdate
    },
    tabs: {},
    json: {},
    incoming: {}
  };
};

export default handlers;
