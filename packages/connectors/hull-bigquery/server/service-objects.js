/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const BigqueryUserRead: ServiceObjectDefinition = {
  service_name: "bigquery_incoming_user",
  name: "User"
};

const BigqueryAccountRead: ServiceObjectDefinition = {
  service_name: "bigquery_incoming_account",
  name: "User"
};

const BigqueryEventRead: ServiceObjectDefinition = {
  service_name: "bigquery_incoming_user_event",
  name: "Event"
};

module.exports = {
  BigqueryUserRead,
  BigqueryAccountRead,
  BigqueryEventRead
};
