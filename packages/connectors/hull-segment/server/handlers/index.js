// @flow
import type { HullHandlersConfiguration } from "hull";
import userUpdateFactory from "./user";
import accountUpdateFactory from "./account";
import statusUpdate from "./status";
import incomingHandler from "./incoming";
import admin from "./admin";
import analyticsClientFactory from "../analytics-client";

export default function(): HullHandlersConfiguration {
  const analyticsClient = analyticsClientFactory();
  const userUpdate = userUpdateFactory(analyticsClient);
  const accountUpdate = accountUpdateFactory(analyticsClient);
  return {
    batches: { userUpdate, accountUpdate },
    subscriptions: { userUpdate, accountUpdate },
    incoming: { incomingHandler },
    statuses: { statusUpdate },
    tabs: { admin }
  };
}
