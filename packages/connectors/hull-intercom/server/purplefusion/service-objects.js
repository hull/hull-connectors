/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const IntercomIncomingCompany: ServiceObjectDefinition = {
  service_name: "intercom_incoming_company",
  name: "Company"
};

const IntercomIncomingLead: ServiceObjectDefinition = {
  service_name: "intercom_incoming_lead",
  name: "Lead"
};

const IntercomIncomingUser: ServiceObjectDefinition = {
  service_name: "intercom_incoming_user",
  name: "User"
};

const IntercomAttributeDefinition: ServiceObjectDefinition = {
  service_name: "intercom_attribute_definition",
  name: "IntercomAttributeDefinition"
};

module.exports = {
  IntercomIncomingCompany,
  IntercomIncomingLead,
  IntercomIncomingUser,
  IntercomAttributeDefinition
};
