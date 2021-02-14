// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import adminHandler from "./admin";
import statusHandler from "./status";
import updateUser from "./update-user";
import segmentHandler from "./segment-handler";
import analyticsClientFactory from "../handlers/analytics-client";
import credentialsHandler from "./credentials-handler";

const handlers = () => (_connector: Connector): HullHandlersConfiguration => {
  const analyticsClient = analyticsClientFactory();

  return {
    statuses: { statusHandler },
    tabs: { adminHandler },
    subscriptions: {
      updateUser: async (
        ctx: HullContext,
        messages: Array<HullUserUpdateMessage>
      ) => {
        try {
          await Promise.all(messages.map(updateUser(analyticsClient, ctx)));
          return {
            type: "next",
            size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
            in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1
          };
        } catch (err) {
          return {
            type: "retry"
          };
        }
      }
    },
    json: { credentialsHandler },
    incoming: { segmentHandler }
  };
};

export default handlers;
