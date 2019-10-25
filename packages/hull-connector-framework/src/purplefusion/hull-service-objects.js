/* @flow */

import type { ServiceObjectDefinition } from "./types";

// class HullIncomingUser {
//   ident: HullUserClaims;
//
//   attributes: HullUserAttributes;
//
//   accountIdent: HullAccountClaims;
//
// }
//
// class HullOutgoingUser {
//   //flat data struct with certain ident fields
//   email: string;
//   anonymous_ids: Array<String>;
//   external_ids: Array<String>;
// }
//
// class HullIncomingAccount {
//   ident: HullAccountClaims;
//   attributes: HullAccountAttributes;
// }
//
// class HullOutgoingAccount {
//   domain: string;
//   anonymous_ids: Array<String>;
//   external_ids: Array<String>;
// }

const WebPayload: ServiceObjectDefinition = {
  service_name: "incoming_webpayload",
  name: "WebPayload"
};

const HullUserRaw: ServiceObjectDefinition = {
  service_name: "HullUserRaw",
  name: "User"
}

const ServiceUserRaw: ServiceObjectDefinition = {
  service_name: "ServiceUserRaw",
  name: "User"
}

const HullIncomingUser: ServiceObjectDefinition = {
  service_name: "HullIncomingUser",
  name: "User"
}

const HullOutgoingUser: ServiceObjectDefinition = {
  service_name: "HullOutgoingUser",
  name: "User"
}

const HullIncomingAccount: ServiceObjectDefinition = {
  service_name: "HullIncomingAccount",
  name: "Account"
}

const HullOutgoingAccount: ServiceObjectDefinition = {
  service_name: "HullOutgoingAccount",
  name: "Account"
}

const HullIncomingDropdownOption: ServiceObjectDefinition = {
  service_name: "HullIncomingDropdownOption",
  name: "DropdownOption"
}

const HullOutgoingDropdownOption: ServiceObjectDefinition = {
  service_name: "HullOutgoingDropdownOption",
  name: "DropdownOption"
}

const HullApiAttributeDefinition: ServiceObjectDefinition = {
  service_name: "HullApiAttributeDefinition",
  name: "HullApiAttributeDefinition"
}

const HullConnectorAttributeDefinition: ServiceObjectDefinition = {
  service_name: "HullConnectorAttributeDefinition",
  name: "HullConnectorAttributeDefinition"
}

const HullConnectorEnumDefinition: ServiceObjectDefinition = {
  service_name: "HullConnectorEnumDefinition",
  name: "HullConnectorEnumDefinition"
}

const HullIncomingUserImportApi: ServiceObjectDefinition = {
  service_name: "HullIncomingUserImportApi",
  name: "User"
}




module.exports = {
  WebPayload,
  HullIncomingUser,
  HullIncomingAccount,
  HullOutgoingUser,
  HullOutgoingAccount,
  HullApiAttributeDefinition,
  HullConnectorAttributeDefinition,
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullConnectorEnumDefinition,
  HullUserRaw,
  ServiceUserRaw,
  HullIncomingUserImportApi
};
