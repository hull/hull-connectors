// @flow
/* eslint-disable global-require */
import type { HullHandlersConfiguration, Connector } from "hull";

const handlers = () => (connector: Connector): HullHandlersConfiguration => {
  const { connectorConfig } = connector;
  /* eslint-disable-next-line no-unused-vars */
  const { hostSecret, port, devMode } = connectorConfig;

  return {
    statuses: {},
    schedules: {},
    subscriptions: {},
    tabs: {},
    json: {},
    incoming: {}
  };
};

export default handlers;
