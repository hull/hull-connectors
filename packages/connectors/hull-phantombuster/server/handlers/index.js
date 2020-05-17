// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import {
  configHandler,
  recentHandler,
  previewHandler,
  removeOldEntriesHandler
} from "hull-vm";
import configData from "./config-data";
import agentsHandler from "./agents-handler";
import statusHandler from "./status-handler";
import scheduledCallHandler from "./scheduledcall-handler";
import apiCall from "./apicall-handler";

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    statuses: { statusHandler },
    schedules: {
      scheduledCall: scheduledCallHandler(EntryModel),
      removeOldEntriesHandler: removeOldEntriesHandler(EntryModel)
    },
    json: {
      agentsHandler,
      getRecent: recentHandler(EntryModel),
      configHandler: configHandler(configData),
      apiCall: apiCall(EntryModel),
      previewHandler
    }
  };
};

export default handler;
