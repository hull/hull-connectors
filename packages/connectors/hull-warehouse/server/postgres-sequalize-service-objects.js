/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

// TODO do some sort of field definition in here has well
// include types, abtraction for custom/unknown fields, and read/only
const PostgresOutgoingAccount: ServiceObjectDefinition = {
  service_name: "postgres_outgoing_account",
  name: "PostgresAccount"
};

const PostgresOutgoingUser: ServiceObjectDefinition = {
  service_name: "postgres_outgoing_user",
  name: "PostgresUser"
};

module.exports = { PostgresOutgoingAccount, PostgresOutgoingUser };
