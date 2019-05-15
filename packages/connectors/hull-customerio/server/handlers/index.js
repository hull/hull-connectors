// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import adminHandler from "./admin";
import updateUser from "./update-user";
import { webhookHandler, statusCheck } from "../actions";

const handlers = () => (_connector: Connector): HullHandlersConfiguration => {
  return {
    statuses: { statusCheck },
    incoming: { webhookHandler },
    tabs: { adminHandler },
    batches: { updateUser },
    subscriptions: { updateUser },
    json: { webhookHandler }
  };
};

export default handlers;
