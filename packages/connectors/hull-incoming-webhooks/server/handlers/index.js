// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import { statusHandler, getRecentHandler, previewHandler } from "hull-vm";
import incomingHandler from "./incoming-handler";
import configHandler from "./config-handler";
import credentialsHandler from "./credentials-handler";

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    statuses: { statusHandler },
    incoming: { incomingHandler: incomingHandler(EntryModel) },
    json: {
      getRecent: getRecentHandler(EntryModel),
      configHandler,
      credentialsHandler,
      previewHandler
    }
  };
};

export default handler;
