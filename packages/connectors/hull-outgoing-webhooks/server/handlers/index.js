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
import configData from "./config-data";
import entityUpdate from "./entity-update";
import shipUpdate from "./ship-update";
import throttlePoolFactory from "../lib/throttle-pool";

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
      userUpdate: entityUpdate("user")({ flow_in, flow_size }, getThrottle),
      accountUpdate: entityUpdate("account")(
        { flow_in, flow_size },
        getThrottle
      ),
      shipUpdate: shipUpdate(getThrottle)
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
