// @flow
import type { HullHandlersConfiguration } from "hull";

import fetchAll from "../actions/fetch-all";
import fetchAllPF from "../actions/fetch-all-pf";
import status from "../actions/status";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";
import onLogin from "../actions/on-login";
import fields from "../actions/fields";
import companyFields from "../actions/company-fields";
import deleteContact from "../actions/delete-contact";
import deleteUser from "../actions/delete-user";
import fetchSegments from "../actions/fetch-segments";
import fetchRecentlyUpdatedUsers from "../actions/fetch-recent-users";
import fetchRecentlyUpdatedLeads from "../actions/fetch-recent-leads";
import fetchRecentlyUpdated from "../actions/fetch-recent-pf";
import webhook from "../actions/webhook";

import userUpdate from "./user-update";
import userSegmentUpdate from "./user-segment-update";
import userSegmentDelete from "./user-segment-delete";
import shipUpdate from "./ship-update";

import fetchAllUsers from "../jobs/fetch-all-users";
import fetchAllLeads from "../jobs/fetch-all-leads";
import fetchRecentUsers from "../jobs/fetch-recent-users";
import fetchRecentLeads from "../jobs/fetch-recent-leads";
import handleBatch from "../jobs/handle-batch";
import handleBulk from "../jobs/handle-bulk";

const { Strategy } = require("passport-intercom");

const handler = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullHandlersConfiguration => {
  return {
    incoming: {
      webhook
    },
    subscriptions: {
      userUpdate,
      shipUpdate,
      userSegmentUpdate,
      userSegmentDelete
    },
    jobs: {
      fetchAllUsers,
      fetchAllLeads,
      fetchRecentUsers,
      fetchRecentLeads,
      handleBatch,
      handleBulk
    },
    batches: { userUpdate },
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
    schedules: {
      fetchRecentlyUpdatedUsers,
      fetchRecentlyUpdatedLeads,
      fetchRecentlyUpdatedCompanies: fetchRecentlyUpdated("Company"),
      fetchSegments
    },
    json: {
      fetchAllLeads: fetchAll("Lead"),
      fetchAllUsers: fetchAll("User"),
      fetchAllCompanies: fetchAllPF("Company"),
      fieldsInbound: fields,
      companyFieldsInbound: companyFields,
      deleteContact,
      deleteUser
    }
  };
};

export default handler;
