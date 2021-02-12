/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const SQLOutgoingAccount: ServiceObjectDefinition = {
  service_name: "sql_outgoing_account",
  name: "SQLAccount"
};

const SQLOutgoingUser: ServiceObjectDefinition = {
  service_name: "sql_outgoing_user",
  name: "SQLUser"
};

module.exports = { SQLOutgoingUser, SQLOutgoingAccount };
