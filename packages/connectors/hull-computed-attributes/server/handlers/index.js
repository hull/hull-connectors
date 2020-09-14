// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import { configHandler, statusHandler } from "hull-vm";

import configData from "./config-data";
import userUpdate from "./user-update";
import previewHandler from "./preview-handler";
import entityHandler from "./entity-handler";

type HandlerType = { flow_size?: number, flow_in?: number };
const handler = ({ flow_size, flow_in }: HandlerType) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    subscriptions: {
      userUpdate: userUpdate({ flow_size, flow_in })
    },
    statuses: { statusHandler },
    json: {
      configHandler: configHandler(configData),
      entityHandler,
      previewHandler
    }
  };
};

export default handler;
