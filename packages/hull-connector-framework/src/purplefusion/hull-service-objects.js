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

const HullEnumMap: ServiceObjectDefinition = {
  service_name: "hull_enum_map",
  name: "HullEnumMap"
};

const WebPayload: ServiceObjectDefinition = {
  service_name: "incoming_webpayload",
  name: "WebPayload"
};

const HullUserRaw: ServiceObjectDefinition = {
  service_name: "HullUserRaw",
  name: "User"
};

const HullLeadRaw: ServiceObjectDefinition = {
  service_name: "HullLeadRaw",
  name: "User"
};

const ServiceUserRaw: ServiceObjectDefinition = {
  service_name: "ServiceUserRaw",
  name: "User"
};

const ServiceLeadRaw: ServiceObjectDefinition = {
  service_name: "ServiceLeadRaw",
  name: "Lead"
};

const ServiceAccountRaw: ServiceObjectDefinition = {
  service_name: "ServiceAccountRaw",
  name: "Account"
};

const ServiceOpportunityRaw: ServiceObjectDefinition = {
  service_name: "ServiceOpportunityRaw",
  name: "Opportunity"
};

const HullIncomingUser: ServiceObjectDefinition = {
  service_name: "HullIncomingUser",
  name: "User"
};

const HullIncomingOpportunity: ServiceObjectDefinition = {
  service_name: "HullIncomingOpportunity",
  name: "Opportunity"
};

const HullOutgoingUser: ServiceObjectDefinition = {
  service_name: "HullOutgoingUser",
  name: "User"
};

const HullIncomingAccount: ServiceObjectDefinition = {
  service_name: "HullIncomingAccount",
  name: "Account"
};

const HullOutgoingAccount: ServiceObjectDefinition = {
  service_name: "HullOutgoingAccount",
  name: "Account"
};

const HullIncomingDropdownOption: ServiceObjectDefinition = {
  service_name: "HullIncomingDropdownOption",
  name: "DropdownOption"
};

const HullOutgoingDropdownOption: ServiceObjectDefinition = {
  service_name: "HullOutgoingDropdownOption",
  name: "DropdownOption"
};

const HullApiAttributeDefinition: ServiceObjectDefinition = {
  service_name: "HullApiAttributeDefinition",
  name: "HullApiAttributeDefinition"
};

const HullConnectorAttributeDefinition: ServiceObjectDefinition = {
  service_name: "HullConnectorAttributeDefinition",
  name: "HullConnectorAttributeDefinition"
};

const HullConnectorEnumDefinition: ServiceObjectDefinition = {
  service_name: "HullConnectorEnumDefinition",
  name: "HullConnectorEnumDefinition"
};

const HullIncomingUserImportApi: ServiceObjectDefinition = {
  service_name: "HullIncomingUserImportApi",
  name: "User"
};

const HullApiSegmentDefinition: ServiceObjectDefinition = {
  service_name: "HullApiSegmentDefinition",
  name: "HullApiSegmentDefinition"
};

const HullApiEventDefinition: ServiceObjectDefinition = {
  service_name: "HullApiEventDefinition",
  name: "HullApiEventDefinition"
};


// Triggers
const HullUserAttributeChangedTrigger: ServiceObjectDefinition = {
  service_name: "HullUserAttributeChangedTrigger",
  name: "User"
};

const HullUserSegmentChangedTrigger: ServiceObjectDefinition = {
  service_name: "HullUserSegmentChangedTrigger",
  name: "User"
};

const HullUserEventTrigger: ServiceObjectDefinition = {
  service_name: "HullUserEventTrigger",
  name: "User"
};

const HullAccountAttributeChangedTrigger: ServiceObjectDefinition = {
  service_name: "HullAccountAttributeChangedTrigger",
  name: "Account"
};

const HullAccountSegmentChangedTrigger: ServiceObjectDefinition = {
  service_name: "HullAccountSegmentChangedTrigger",
  name: "Account"
};

const EntityCreatedTrigger: ServiceObjectDefinition = {
  service_name: "EntityCreatedTrigger",
  name: "Entity"
};

module.exports = {
  HullEnumMap,
  WebPayload,
  HullIncomingUser,
  HullIncomingAccount,
  HullOutgoingUser,
  HullOutgoingAccount,
  HullUserAttributeChangedTrigger,
  HullUserSegmentChangedTrigger,
  HullAccountAttributeChangedTrigger,
  HullAccountSegmentChangedTrigger,
  EntityCreatedTrigger,
  HullUserEventTrigger,
  HullApiAttributeDefinition,
  HullConnectorAttributeDefinition,
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullConnectorEnumDefinition,
  HullUserRaw,
  HullLeadRaw,
  ServiceUserRaw,
  ServiceLeadRaw,
  ServiceAccountRaw,
  ServiceOpportunityRaw,
  HullIncomingUserImportApi,
  HullApiSegmentDefinition,
  HullApiEventDefinition,
  HullIncomingOpportunity
};
