// @flow
import type { HullHandlersConfiguration, Connector } from "hull";

import getRecent from "./get-recent-handler";
import incomingHandler from "./incoming-handler";
import previewHandler from "./preview-handler";
import statusHandler from "./status-handler";
import confHandler from "./config-handler";

const html = [
  {
    url: "/admin.html",
    method: "get",
    handler: {
      callback: () => ({ pageLocation: "admin.html" })
    }
  }
];

const handler = ({ EntryModel }: { EntryModel: any }) => (
  _connector: Connector
): HullHandlersConfiguration => {
  // const { connectorConfig } = connector;
  // const { hostSecret } = connectorConfig;
  const callback = incomingHandler(EntryModel);
  return {
    html,
    statuses: [
      {
        url: "/status",
        handler: {
          callback: statusHandler
        }
      }
    ],
    json: [
      {
        url: "/recent",
        handler: {
          callback: getRecent(EntryModel)
        }
      },
      {
        url: "/conf",
        handler: {
          callback: confHandler
        }
      },
      {
        url: "/compute",
        handler: {
          callback: previewHandler
        }
      }
    ],
    incoming: [
      {
        url: "/webhooks/:connectorId/:token",
        handler: {
          callback
        }
      },
      {
        url: "/webhooks/:connectorId",
        handler: {
          callback
        }
      }
    ]
  };
};

export default handler;
