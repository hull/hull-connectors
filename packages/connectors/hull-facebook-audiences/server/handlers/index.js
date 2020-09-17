// @flow
import type { HullHandlersConfiguration } from "hull";
import { Strategy } from "passport-facebook";
import onAuthorize from "./on-authorize";
import onStatus from "./on-status";

const userUpdateSmartNotifierHandler = require("./user-update-smart-notifier");
const adminHandlerFactory = require("./new-admin");
const statusHandler = require("./status");
const userUpdateBatch = require("./user-update-batch");
const segmentUpdateSmartNotifierHandler = require("./segment-update-smart-notifier");
const segmentDeleteSmartNotifierHandler = require("./segment-delete-smart-notifier");

const handlers = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}): HullHandlersConfiguration => {
  const { getAdmin, saveAccount } = adminHandlerFactory({
    clientID,
    clientSecret
  });
  return {
    statuses: { statusHandler },
    tabs: {
      admin: getAdmin
    },
    batches: { user_update: userUpdateBatch },
    subscriptions: {
      user_update: userUpdateSmartNotifierHandler,
      users_segment_update: segmentUpdateSmartNotifierHandler,
      users_segment_delete: segmentDeleteSmartNotifierHandler
    },
    schedules: {},
    private_settings: {
      oauth: () => ({
        onAuthorize,
        onStatus,
        Strategy,
        clientID,
        clientSecret
      })
    },
    json: {
      saveAccount
    }
  };
};

export default handlers;
