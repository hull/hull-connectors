// @flow
import type { HullHandlersConfiguration } from "hull";

import fetchAll from "../actions/fetch-all";
import status from "../actions/status";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";
import onLogin from "../actions/on-login";
import fields from "../actions/fields";
import deleteContact from "../actions/delete-contact";
import deleteUser from "../actions/delete-user";
import fetchSegments from "../actions/fetch-segments";
import fetchRecentlyUpdatedUsers from "../actions/fetch-recent-users";
import fetchRecentlyUpdatedLeads from "../actions/fetch-recent-leads";

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
      fetchSegments
    },
    json: {
      fetchAllLeads: fetchAll("Lead"),
      fetchAllUsers: fetchAll("User"),
      fieldsInbound: fields,
      deleteContact,
      deleteUser
    }
  };
};

export default handler;
