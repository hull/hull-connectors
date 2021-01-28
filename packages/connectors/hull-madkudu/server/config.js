// @flow

import type { HullConnectorConfig } from "hull";

import statusHandler from "./handlers/status-handler";
import accountUpdate from "./handlers/account-update";
import userUpdate from "./handlers/user-update";
import companyAttributes from "./handlers/company-attributes";
import personAttributes from "./handlers/person-attributes";

export default function connectorConfig(): HullConnectorConfig {
  return {
    handlers: {
      subscriptions: {
        userUpdate,
        accountUpdate
      },
      statuses: {
        statusHandler
      },
      private_settings: {
        companyAttributes,
        personAttributes
      }
    }
  };
}
