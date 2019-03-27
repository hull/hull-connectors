// @flow
import type { HullHandlersConfiguration, Connector } from "hull";
import {
  fetch,
  fetchAll,
  fetchAllCompanies,
  fetchRecentCompanies,
  checkToken,
  statusCheck,
  getContactProperties,
  getIncomingUserClaims,
  getIncomingAccountClaims,
  getCompanyProperties,
  oauth
} from "../actions";

import account_update from "./account-update";
import user_update from "./user-update";
import ship_update from "./ship-update";
import users_segment_update from "./users-segment-update";
import accounts_segment_update from "./accounts-segment-update";

// const notifications = ;
const batches = [
  {
    url: "/batch",
    handlers: {
      "user:update": {
        callback: user_update
      },
      "account:update": {
        callback: account_update
      }
    }
  }
];
const schedules = [
  {
    url: "/monitor/checkToken",
    handler: {
      callback: checkToken,
      options: { fireAndForget: true }
    }
  },
  {
    url: "/fetch-recent-companies",
    handler: {
      callback: fetchRecentCompanies,
      options: { fireAndForget: true }
    }
  },
  {
    url: "/fetch-recent-contacts",
    handler: {
      callback: fetch,
      options: { fireAndForget: true }
    }
  },
  {
    url: "/sync",
    handler: {
      callback: fetch,
      options: { fireAndForget: true }
    }
  }
];
const statuses = [
  {
    url: "/status",
    handler: {
      callback: statusCheck,
      options: {}
    }
  }
];
const json = [
  {
    url: "/fetch-all",
    handler: {
      callback: fetchAll,
      options: {}
    }
  },
  {
    url: "/fetch-all-contacts",
    handler: {
      callback: fetchAll,
      options: {}
    }
  },
  {
    url: "/fetch-all-companies",
    handler: {
      callback: fetchAllCompanies,
      options: {}
    }
  },
  {
    url: "/schema/contact_properties",
    handler: {
      callback: getContactProperties,
      options: { respondWithError: true }
    }
  },
  {
    url: "/schema/incoming_user_claims",
    handler: {
      callback: getIncomingUserClaims,
      options: { respondWithError: false }
    }
  },
  {
    url: "/schema/incoming_account_claims",
    handler: {
      callback: getIncomingAccountClaims,
      options: { respondWithError: false }
    }
  },
  {
    url: "/schema/company_properties",
    handler: {
      callback: getCompanyProperties,
      options: {}
    }
  }
];
//
// export default function({
//   hostSecret,
//   clientID,
//   clientSecret
// }: {
//   hostSecret: string,
//   clientID: string,
//   clientSecret: string
// }): HullHandlersConfiguration {
//   return
// }

const handler = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (connector: Connector): HullHandlersConfiguration => {
  const { hostSecret } = connector.connectorConfig;
  return {
    statuses,
    schedules,
    batches,
    json,
    notifications: [
      {
        url: "/smart-notifier",
        handlers: {
          "user:update": {
            callback: user_update
          },
          "account:update": {
            callback: account_update
          },
          "ship:update": {
            callback: ship_update
          },
          "users_segment:update": {
            callback: users_segment_update
          },
          "accounts_segment:update": {
            callback: accounts_segment_update
          }
        }
      }
    ],
    routers: [
      {
        url: "/auth",
        handler: oauth({ hostSecret, clientID, clientSecret })
      }
    ]
  };
};

export default handler;
