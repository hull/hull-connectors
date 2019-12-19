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

const CopperCRMIncomingCompany: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_company",
  name: "Company"
};

const CopperCRMIncomingOpportunity: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_opportunity",
  name: "Opportunity"
};

const CopperCRMIncomingActivity: ServiceObjectDefinition = {
  service_name: "coppercrm_incoming_activity",
  name: "Activity"
}

module.exports = {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity,
  CopperCRMIncomingActivity
};
