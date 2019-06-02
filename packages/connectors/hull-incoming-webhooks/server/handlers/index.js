// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import getRecent from "hull-vm/server/handlers/get-recent-handler";
import incomingHandler from "./incoming-handler";
import previewHandler from "hull-vm/server/handlers/preview-handler";
import status from "./status";
import confHandler from "./config-handler";
import credentialsHandler from "./credentials-handler";

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    statuses: { status },
    incoming: { incomingHandler: incomingHandler(EntryModel) },
    json: {
      getRecent: getRecent(EntryModel),
      confHandler,
      credentialsHandler,
      previewHandler
    }
  };
};

export default handler;
