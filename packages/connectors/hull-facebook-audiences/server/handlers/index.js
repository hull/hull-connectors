// @flow
import type { HullHandlersConfiguration, Connector } from "hull";

const userUpdateSmartNotifierHandler = require("./user-update-smart-notifier");
const adminHandler = require("./admin");
const statusHandler = require("./status");
const userUpdateBatch = require("./user-update-batch");
const segmentUpdateSmartNotifierHandler = require("./segment-update-smart-notifier");
const segmentDeleteSmartNotifierHandler = require("./segment-delete-smart-notifier");

const handlers = () => (_connector: Connector): HullHandlersConfiguration => {
  return {
    statuses: { statusHandler },
    tabs: { admin: adminHandler },
    batches: { user_update: userUpdateBatch },
    subscriptions: {
      user_update: userUpdateSmartNotifierHandler,
      users_segment_update: segmentUpdateSmartNotifierHandler,
      users_segment_delete: segmentDeleteSmartNotifierHandler
    },
    schedules: {}
    // json: { webhookHandler, credentialsHandler }
  };
};

export default handlers;
