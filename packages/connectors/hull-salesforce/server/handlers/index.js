// @flow
import type { HullHandlersConfiguration } from "hull";

import fetch from "../actions/fetch";
import fetchAllContacts from "../actions/fetch-all-contacts";
import fetchAllLeads from "../actions/fetch-all-leads";
import fetchAllAccounts from "../actions/fetch-all-accounts";
import fetchAllTasks from "../actions/fetch-all-tasks";
import fetchDeletions from "../actions/fetch-deletions";
import status from "../actions/status";
import getContactProperties from "../actions/get-contact-properties";
import getLeadProperties from "../actions/get-lead-properties";
import getAccountProperties from "../actions/get-account-properties";
import getTaskProperties from "../actions/get-task-properties";
import getLeadAssignmentRules from "../actions/get-lead-assignment-rules";
import onStatus from "../actions/on-status";
import onAuthorize from "../actions/on-authorize";
import onLogin from "../actions/on-login";

import accountUpdate from "./account-update";
import userUpdate from "./user-update";
import shipUpdate from "./ship-update";

const Strategy = require("passport-forcedotcom").Strategy;

const handler = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullHandlersConfiguration => {
  return {
    subscriptions: {
      shipUpdate,
      userUpdate,
      accountUpdate
    },
    batches: { userUpdate, accountUpdate },
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
      fetch,
      fetchDeletions
    },
    json: {
      fetchAllLeads,
      fetchAllContacts,
      fetchAllAccounts,
      fetchAllTasks,
      leadAssignmentRules: getLeadAssignmentRules,
      fieldsSalesforceLeadInbound: getLeadProperties(),
      fieldsSalesforceLeadOutbound: getLeadProperties({ fieldType: "updateable" }),
      fieldsSalesforceContactInbound: getContactProperties(),
      fieldsSalesforceContactOutbound: getContactProperties({ fieldType: "updateable" }),
      fieldsSalesforceAccountInbound: getAccountProperties(),
      fieldsSalesforceAccountOutbound: getAccountProperties({ fieldType: "updateable" }),
      // fieldsSalesforceTaskInbound: getTaskProperties(),
      fieldsSalesforceTaskOutbound: getTaskProperties({ fieldType: "updateable" }),
      fieldsSalesforceTaskUnique: getTaskProperties({ fieldType: "unique" }),
      fieldsSalesforceTaskReference: getTaskProperties({ fieldType: "reference" })
    }
  };
};

export default handler;
