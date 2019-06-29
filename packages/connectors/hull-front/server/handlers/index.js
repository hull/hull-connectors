// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import incomingHandler from "./incoming-handler";
import credentialsHandler from "./credentials-handler";
import statusHandler from "./status-handler";

const handler = (): HullHandlersConfiguration => {
  return {
    statuses: { statusHandler },
    incoming: { incomingHandler },
    json: {
      credentialsHandler
    }
  };
};

export default handler;
