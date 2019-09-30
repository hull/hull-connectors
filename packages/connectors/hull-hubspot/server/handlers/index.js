// @flow
import type { HullHandlersConfiguration } from "hull";

import fetch from "../actions/fetch";
import fetchAll from "../actions/fetch-all";
import checkCachedCredentials from "../actions/check-cached-credentials";
import fetchAllCompanies from "../actions/fetch-all-companies";
import fetchAllEmailEvents from "../actions/fetch-all-email-events";
import fetchRecentEmailEvents from "../actions/fetch-recent-email-events";
import fetchHotOffThePressEvents from "../actions/fetch-hot-off-the-press-events";
import fetchRecentCompanies from "../actions/fetch-recent-companies";
import checkToken from "../actions/check-token";
import status from "../actions/status";
import getContactProperties from "../actions/get-contact-properties";
import getIncomingUserClaims from "../actions/get-incoming-user-claims";
import getIncomingAccountClaims from "../actions/get-incoming-account-claims";
import getCompanyProperties from "../actions/get-company-properties";
import lastFetchedStatus from "../actions/last-fetched-status";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";
import onLogin from "../actions/on-login";
import incomingWebhooksHandler from "../actions/incoming-webhook";

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
    incoming: { incomingWebhooksHandler },
    statuses: { status },
    schedules: {
      checkCachedCredentials,
      checkToken,
      fetchRecentCompanies,
      fetch,
      fetchRecentEmailEvents
    },
    json: {
      lastFetchedStatus,
      fetchAll,
      fetchAllCompanies,
      fetchAllEmailEvents,
      fetchHotOffThePressEvents,
      getContactProperties,
      getIncomingUserClaims,
      getIncomingAccountClaims,
      getCompanyProperties
    }
  };
};

export default handler;
