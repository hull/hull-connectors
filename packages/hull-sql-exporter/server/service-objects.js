/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const SQLUserWrite: ServiceObjectDefinition = {
  service_name: "sql_outgoing_user",
  name: "SQLUser"
};

const SQLAccountWrite: ServiceObjectDefinition = {
  service_name: "sql_outgoing_account",
  name: "SQLAccount"
};

const SQLUserSchema: ServiceObjectDefinition = {
  service_name: "sql_user_schema",
  name: "UserSchema"
};

const SQLAccountSchema: ServiceObjectDefinition = {
  service_name: "sql_account_schema",
  name: "AccountSchema"
};

module.exports = {
  SQLUserWrite,
  SQLAccountWrite,
  SQLUserSchema,
  SQLAccountSchema
};
