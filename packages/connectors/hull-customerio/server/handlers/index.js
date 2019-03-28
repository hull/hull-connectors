// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import adminHandler from "../handlers/admin";
import { middleware } from "../lib/crypto";
import updateUser from "./update-user"
import { webhookHandler, statusCheck } from "../actions";

const handlers = ({  }: {  }) => (
  connector: Connector
): HullHandlersConfiguration => {
  const { hostSecret } = connector.connectorConfig;
  return {
    statuses: [
      {
        url: "/status",
        handler: {
          callback: statusCheck
        }
      }
    ],
    incoming: [
      {
        url: "/webhook",
        handler: {
          callback: webhookHandler
        }
      }
    ],
    html: [
      {
        url: "/admin.html",
        handler: {
          callback: adminHandler
        }
      }
    ],
    batches: [
      {
        url: "/batch",
        handlers: {
          "user:update": {
            callback: updateUser
          }
        }
      }
    ],
    notifications: [
      {
        url: "/smart-notifier",
        handlers: {
          "user:update": {
            callback: updateUser
          }
        }
      }
    ]
  };
};

export default handlers;
