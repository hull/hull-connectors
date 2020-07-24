// @flow
import type { HullHandlersConfiguration } from "hull";

import fetchAll from "../actions/fetch-all";
import status from "../actions/status";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";
import onLogin from "../actions/on-login";
import fields from "../actions/fields";
import companyFields from "../actions/company-fields";
import deleteContact from "../actions/delete-contact";
import deleteUser from "../actions/delete-user";
import fetchSegments from "../actions/fetch-segments";
import fetchRecentlyUpdated from "../actions/fetch-recent";
import webhook from "../actions/webhook";

import userUpdate from "./user-update";
import userSegmentUpdate from "./user-segment-update";
import userSegmentDelete from "./user-segment-delete";
import shipUpdate from "./ship-update";

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
      fetchRecentlyUpdatedUsers: fetchRecentlyUpdated("Users"),
      fetchRecentlyUpdatedLeads: fetchRecentlyUpdated("Leads"),
      fetchRecentlyUpdatedCompanies: fetchRecentlyUpdated("Companies"),
      fetchSegments
    },
    json: {
      fetchAllLeads: fetchAll("Leads"),
      fetchAllCompanies: fetchAll("Companies"),
      fetchAllUsers: fetchAll("Users"),
      fieldsInbound: fields,
      companyFieldsInbound: companyFields,
      deleteContact,
      deleteUser
    }
  };
};

export default handler;
