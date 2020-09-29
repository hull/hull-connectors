// @flow
import type { HullHandlersConfiguration } from "hull";
import { Strategy } from "passport-facebook";
import onAuthorizeFactory from "./on-authorize";
import onStatus from "./on-status";

const userUpdateSmartNotifierHandler = require("./user-update-smart-notifier");
const adminHandler = require("./admin");
const statusHandler = require("./status");
const userUpdateBatch = require("./user-update-batch");

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}): HullHandlersConfiguration => {
  const { getAudiences, syncAudiences, accountList } = adminHandler();
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
        onAuthorize: onAuthorizeFactory({ clientID, clientSecret }),
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
