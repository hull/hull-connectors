// @flow
import type { HullHandlersConfiguration } from "hull";
import { Strategy } from "passport-facebook";
import onAuthorize from "./on-authorize";
import onStatus from "./on-status";

const userUpdateSmartNotifierHandler = require("./user-update-smart-notifier");
const adminHandlerFactory = require("./admin");
const statusHandler = require("./status");
const userUpdateBatch = require("./user-update-batch");

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}): HullHandlersConfiguration => {
  const { getAudiences, syncAudiences, accountList } = adminHandlerFactory({
    clientID,
    clientSecret
  });
  return {
    statuses: { statusHandler },
    tabs: {
      audiences: getAudiences
    },
    html: {
      syncAudiences
    },
    subscriptions: {
      user_update: userUpdateSmartNotifierHandler
    },
    schedules: {},
    private_settings: {
      accountList,
      oauth: () => ({
        onAuthorize,
        onStatus,
        Strategy,
        clientID,
        clientSecret
      })
    },
    json: {
      batch: userUpdateBatch
    }
  };
};

export default handlers;
