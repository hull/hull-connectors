/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

// TODO do some sort of field definition in here has well
// include types, abtraction for custom/unknown fields, and read/only
const PostgresOutgoingAccount: ServiceObjectDefinition = {
  name: "postgres_outgoing_account",
  service_name: "PostgresAccount"
};

const PostgresOutgoingUser: ServiceObjectDefinition = {
  name: "postgres_outgoing_user",
  service_name: "PostgresUser"
};

module.exports = { PostgresOutgoingAccount, PostgresOutgoingUser };
