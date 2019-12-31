/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const WarehouseUserWrite: ServiceObjectDefinition = {
  service_name: "warehouse_outgoing_user",
  name: "User"
};

const WarehouseAccountWrite: ServiceObjectDefinition = {
  service_name: "warehouse_outgoing_account",
  name: "Account"
};

const PostgresUserSchema: ServiceObjectDefinition = {
  service_name: "postgres_user_schema",
  name: "UserSchema"
};

const PostgresAccountSchema: ServiceObjectDefinition = {
  service_name: "postgres_account_schema",
  name: "AccountSchema"
};

module.exports = {
  WarehouseUserWrite,
  WarehouseAccountWrite,
  PostgresUserSchema,
  PostgresAccountSchema
};
