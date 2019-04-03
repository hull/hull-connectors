// @flow
import type { HullHandlersConfiguration, Connector } from "hull";

import getRecent from "./get-recent-handler";
import incomingHandler from "./incoming-handler";
import previewHandler from "./preview-handler";
import statusHandler from "./status-handler";
import confHandler from "./config-handler";

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: { admin: () => ({ pageLocation: "admin.html" }) },
    statuses: { statusHandler },
    incoming: { incomingHandler: incomingHandler(EntryModel) },
    json: {
      getRecent: getRecent(EntryModel),
      confHandler,
      previewHandler
    }
  };
};

export default handler;
