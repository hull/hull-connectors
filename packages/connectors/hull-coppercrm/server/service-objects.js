/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const CopperCRMIncomingLead: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_lead",
  name: "Lead"
};

const CopperCRMIncomingPerson: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_person",
  name: "Person"
};

const CopperCRMIncomingAccount: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_account",
  name: "Account"
};

const CopperCRMIncomingOpportunity: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_opportunity",
  name: "Opportunity"
};

module.exports = {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingAccount,
  CopperCRMIncomingOpportunity
};
