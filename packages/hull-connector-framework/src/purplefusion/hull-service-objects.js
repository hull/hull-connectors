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

const HullUserRaw: ServiceObjectDefinition = {
  name: "HullUserRaw",
  service_name: "User"
}

const ServiceUserRaw: ServiceObjectDefinition = {
  name: "ServiceUserRaw",
  service_name: "User"
}

const HullIncomingUser: ServiceObjectDefinition = {
  name: "HullIncomingUser",
  service_name: "User"
}

const HullOutgoingUser: ServiceObjectDefinition = {
  name: "HullOutgoingUser",
  service_name: "User"
}

const HullIncomingAccount: ServiceObjectDefinition = {
  name: "HullIncomingAccount",
  service_name: "Account"
}

const HullOutgoingAccount: ServiceObjectDefinition = {
  name: "HullOutgoingAccount",
  service_name: "Account"
}

const HullIncomingDropdownOption: ServiceObjectDefinition = {
  name: "HullIncomingDropdownOption",
  service_name: "DropdownOption"
}

const HullOutgoingDropdownOption: ServiceObjectDefinition = {
  name: "HullOutgoingDropdownOption",
  service_name: "DropdownOption"
}

const HullApiAttributeDefinition: ServiceObjectDefinition = {
  name: "HullApiAttributeDefinition",
  service_name: "HullApiAttributeDefinition"
}

const HullConnectorAttributeDefinition: ServiceObjectDefinition = {
  name: "HullConnectorAttributeDefinition",
  service_name: "HullConnectorAttributeDefinition"
}

const HullConnectorEnumDefinition: ServiceObjectDefinition = {
  name: "HullConnectorEnumDefinition",
  service_name: "HullConnectorEnumDefinition"
}

const HullIncomingUserImportApi: ServiceObjectDefinition = {
  name: "HullIncomingUserImportApi",
  service_name: "User"
}




module.exports = {
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
