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
import callHandler from "./call-handler";

const handler = (_connector: Connector): HullHandlersConfiguration => {
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    subscriptions: {},
    statuses: { statusHandler },
    json: {
      callHandler,
      configHandler: configHandler(configData),
      entityListHandler,
      previewHandler
    }
  };
};

export default handler;
