// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import {
  configHandler,
  statusHandler,
  recentHandler,
  previewHandler
} from "hull-vm";
import configData from "./config-data";
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
    schedules: { scheduledCall: scheduledCallHandler(EntryModel) },
    json: {
      getRecent: recentHandler(EntryModel),
      configHandler: configHandler(configData),
      apiCall: apiCall(EntryModel),
      previewHandler
    }
  };
};

export default handler;
