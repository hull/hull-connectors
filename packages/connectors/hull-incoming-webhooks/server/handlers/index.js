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
  previewHandler,
  removeOldEntriesHandler
} from "hull-vm";
import incomingHandler from "./incoming-handler";
import configData from "./config-data";
import credentialsHandler from "./credentials-handler";

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    schedules: {
      removeOldEntriesHandler: removeOldEntriesHandler(EntryModel)
    },
    statuses: { statusHandler },
    incoming: { incomingHandler: incomingHandler(EntryModel) },
    json: {
      getRecent: recentHandler(EntryModel),
      configHandler: configHandler(configData),
      credentialsHandler,
      previewHandler
    }
  };
};

export default handler;
