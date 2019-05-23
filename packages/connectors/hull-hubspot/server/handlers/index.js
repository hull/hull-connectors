// @flow
import type { HullHandlersConfiguration } from "hull";
import {
  fetch,
  fetchAll,
  fetchAllCompanies,
  fetchRecentCompanies,
  checkToken,
  status,
  getContactProperties,
  getIncomingUserClaims,
  getIncomingAccountClaims,
  getCompanyProperties,
  onStatus,
  onAuthorize,
  onLogin,
  admin
} from "../actions";

import account_update from "./account-update";
import user_update from "./user-update";
import ship_update from "./ship-update";
import users_segment_update from "./users-segment-update";
import accounts_segment_update from "./accounts-segment-update";

const Strategy = require("passport-hubspot-oauth2.0");

const handler = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullHandlersConfiguration => {
  return {
    subscriptions: {
      user_update,
      account_update,
      ship_update,
      users_segment_update,
      accounts_segment_update
    },
    batches: { user_update, account_update },
    tabs: { admin },
    private_settings: {
      oauth: () => ({
        onAuthorize,
        onLogin,
        onStatus,
        Strategy,
        clientID,
        clientSecret
      })
    },
    statuses: { status },
    schedules: { checkToken, fetchRecentCompanies, fetch },
    json: {
      fetchAll,
      fetchAllCompanies,
      getContactProperties,
      getIncomingUserClaims,
      getIncomingAccountClaims,
      getCompanyProperties
    }
  };
};

export default handler;
