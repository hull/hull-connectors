// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import adminHandler from "../handlers/admin";
import { middleware } from "../lib/crypto";
import updateUser from "./update-user"
import { webhookHandler, statusCheck } from "../actions";

const handlers = ({  }: {  }) => (
  connector: Connector
): HullHandlersConfiguration => {
  return {
    statuses: { statusCheck },
    incoming: { webhookHandler },
    tabs: { adminHandler },
    batches: { updateUser },
    subscriptions: { updateUser }
  };
};

export default handlers;
