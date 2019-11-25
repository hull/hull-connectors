/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const ZapierUserWrite: ServiceObjectDefinition = {
  service_name: "zapier_outgoing_user",
  name: "ZapierUser"
};

const ZapierUserRead: ServiceObjectDefinition = {
  service_name: "zapier_incoming_user",
  name: "ZapierUser"
};

const ZapierAccountRead: ServiceObjectDefinition = {
  service_name: "zapier_incoming_account",
  name: "ZapierAccount"
};

module.exports = {
  ZapierUserWrite,
  ZapierUserRead,
  ZapierAccountRead
};
