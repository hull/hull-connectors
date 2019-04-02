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

// const schedules = [
  // checkToken,
  // fetchRecentCompanies,
  // fetch
  // {
  //   url: "/sync",
  //   handler: {
  //     callback: fetch,
  //     options: { fireAndForget: true }
  //   }
  // }
// ];
const handler = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (connector: Connector): HullHandlersConfiguration => {
  const { hostSecret } = connector.connectorConfig;
  return {
    subscriptions: {
      user_update,
      account_update,
      ship_update,
      users_segment_update,
      accounts_segment_update
    },
    batches: { user_update, account_update },
    tabs: {
      auth: oauth({ hostSecret, clientID, clientSecret })
    },
    statuses: { statusCheck },
    schedules: { checkToken, fetchRecentCompanies, fetch },
    json: {
      fetchAll,
      fetchAll,
      fetchAllCompanies,
      getContactProperties,
      getIncomingUserClaims,
      getIncomingAccountClaims,
      getCompanyProperties,
    },
  };
};

export default handler;
