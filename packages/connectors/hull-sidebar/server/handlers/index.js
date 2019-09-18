// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import entityHandler from "./entity-handler";
import credentialsHandler from "./credentials-handler";
import statusHandler from "./status-handler";

const handler = (): HullHandlersConfiguration => {
  return {
    statuses: { statusHandler },
    json: {
      entityHandler,
      credentialsHandler
    }
  };
};

export default handler;
