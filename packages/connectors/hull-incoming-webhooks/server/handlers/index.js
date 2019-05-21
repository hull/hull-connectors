// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import getRecent from "./get-recent-handler";
import incomingHandler from "./incoming-handler";
import previewHandler from "./preview-handler";
import status from "./status";
import confHandler from "./config-handler";

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
      previewHandler
    }
  };
};

export default handler;
