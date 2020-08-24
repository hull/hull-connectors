/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const BigqueryUserRead: ServiceObjectDefinition = {
  service_name: "bigquery_incoming_user",
  name: "User"
};

const BigqueryAccountRead: ServiceObjectDefinition = {
  service_name: "bigquery_incoming_user",
  name: "User"
};

module.exports = {
  BigqueryUserRead,
  BigqueryAccountRead
};
