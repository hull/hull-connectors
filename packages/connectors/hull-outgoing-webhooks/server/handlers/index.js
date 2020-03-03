// @flow
import type {
  HullExternalResponse,
  HullHandlersConfiguration,
  Connector
} from "hull";

import {
  entityHandler,
  configHandler,
  statusHandler,
  previewHandler
} from "hull-vm";
import { configData, shipUpdate, throttlePoolFactory } from "hull-webhooks";
import userUpdate from "./user-update";

type HandlerType = { flow_size?: number, flow_in?: number };
const handler = ({ flow_size, flow_in }: HandlerType) => (
  _connector: Connector
): HullHandlersConfiguration => {
  const getThrottle = throttlePoolFactory();
  return {
    tabs: {
      admin: (): HullExternalResponse => ({ pageLocation: "admin.html" })
    },
    subscriptions: {
      userUpdate: userUpdate({ flow_in, flow_size }, getThrottle),
      shipUpdate: shipUpdate(getThrottle)
    },
    statuses: { statusHandler },
    json: {
      configHandler: configHandler(configData({ entity: "user" })),
      entityHandler,
      previewHandler
    }
  };
};

export default handler;
