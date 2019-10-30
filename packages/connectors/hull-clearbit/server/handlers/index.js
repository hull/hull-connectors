// @flow

import type { HullExternalResponse, HullHandlersConfiguration } from "hull";

import statusHandler from "./status";
import prospectHandler from "./prospect";
import saveHandler from "./save";
import webhookHandler from "./webhook";
import updateUser from "./update-user";
import updateAccount from "./update-account";
import companyProperties from "./company-properties";
import personProperties from "./person-properties";
import prospectProperties from "./prospect-properties";

type HandlerType = { flow_size: number, flow_in: number };

const handler = ({
  flow_size,
  flow_in
}: HandlerType): HullHandlersConfiguration => ({
  json: {
    prospectHandler,
    saveHandler,
    companyProperties,
    personProperties,
    prospectProperties
  },
  tabs: {
    admin: (): HullExternalResponse => ({ pageLocation: "/admin.html" })
  },
  incoming: {
    webhookHandler
  },
  statuses: {
    statusHandler
  },
  subscriptions: {
    updateUser: updateUser({ flow_size, flow_in }),
    updateAccount: updateAccount({ flow_size, flow_in })
  }
});

export default handler;
