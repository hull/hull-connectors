// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import {
  entityListHandler,
  configHandler,
  statusHandler,
  previewHandler
} from "hull-vm";
import configData from "./config-data";
import accountUpdate from "./account-update";

type HandlerType = { flow_size?: number, flow_in?: number };
const handler = ({ flow_size, flow_in }: HandlerType) => (
  _connector: Connector
): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    subscriptions: {
      accountUpdate: accountUpdate({ flow_size, flow_in })
    },
    statuses: { statusHandler },
    json: {
      configHandler: configHandler(configData),
      entityListHandler,
      previewHandler
    }
  };
};

export default handler;
