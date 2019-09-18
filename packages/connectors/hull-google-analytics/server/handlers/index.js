// @flow
/* eslint-disable global-require */
import type { HullHandlersConfiguration, Connector } from "hull";
import userUpdate from "./user-update";

const handlers = (_connector: Connector): HullHandlersConfiguration => {
  return {
    statuses: {},
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
