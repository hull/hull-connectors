/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const BigqueryUserRead: ServiceObjectDefinition = {
  service_name: "bigquery_user_read",
  name: "User"
};

const BigqueryAccountRead: ServiceObjectDefinition = {
  service_name: "bigquery_account_read",
  name: "Account"
};

const BigqueryEventRead: ServiceObjectDefinition = {
  service_name: "bigquery_user_event_read",
  name: "Event"
};

module.exports = {
  BigqueryUserRead,
  BigqueryAccountRead,
  BigqueryEventRead
};
