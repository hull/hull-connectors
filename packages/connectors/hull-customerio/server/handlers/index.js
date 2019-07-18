// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import adminHandler from "./admin";
import credentialsHandler from "./credentials";
import webhookHandler from "./webhook";
import statusCheck from "./status";
import updateUser from "./update-user";

const handlers = () => (_connector: Connector): HullHandlersConfiguration => {
  return {
    statuses: { statusCheck },
    incoming: { webhookHandler },
    tabs: { adminHandler },
    batches: { updateUser },
    subscriptions: { updateUser },
    json: { webhookHandler, credentialsHandler }
  };
};

export default handlers;
