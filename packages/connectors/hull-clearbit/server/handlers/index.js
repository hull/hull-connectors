// @flow

import type { HullExternalResponse, HullHandlersConfiguration } from "hull";

import statusHandler from "./status";
import prospectHandler from "./prospect";
import webhookHandler from "./webhook";
import updateUser from "./update-user";
import updateAccount from "./update-account";

export default function handlers(): HullHandlersConfiguration {
  return {
    json: {
      prospectHandler
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
      updateUser,
      updateAccount
    },
    batches: {
      updateUser,
      updateAccount
    }
  };
}
