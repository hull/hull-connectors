/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

// TODO do some sort of field definition in here has well
// include types, abtraction for custom/unknown fields, and read/only
const MarketoOutgoingCompany: ServiceObjectDefinition = {
  name: "marketo_outgoing_company",
  service_name: "Company"
};

const MarketoIncomingCompany: ServiceObjectDefinition = {
  name: "marketo_incoming_company",
  service_name: "Company"
};

const MarketoOutgoingLead: ServiceObjectDefinition = {
  name: "marketo_outgoing_lead",
  service_name: "Lead"
  // TODO there's an issue with adding stuff to this because the variables get replaced if we put these objects inline
  // and because service objectdefinition is a type, we can't detect it
  // so pretty much anywere we use these inline the glue is problematic if it has variables...
  // is that a bug or a feature I wonder???  Maybe that's the key?
  // are these part of the glue??? what if I put an instruction in here???
  // attributes: {
  //   id: {
  //     replaceWith: "update.${message.user.id}[0].id"
  //   }
  // }
};

const MarketoIncomingLead: ServiceObjectDefinition = {
  name: "marketo_incoming_lead",
  service_name: "Lead"
};

const MarketoIncomingStreamLead: ServiceObjectDefinition = {
  name: "marketo_incoming_stream_lead",
  service_name: "Lead",
  stream: "csv"
};

const MarketoIncomingLeadActivity: ServiceObjectDefinition = {
  name: "marketo_incoming_lead_activity",
  service_name: "Lead-Update"
  // attributes: {
  //   activityTypeId: {
  //     enumReplace: {
  //       map: cacheWrap(60, transformTo(HullEnumDefinition, marketo("getActivityTypeIds"))),
  //       keyParam: "id",
  //       valueParam: "name"
  //     }
  //   }
  // }
};

const MarketoLeadAttributeDefinition: ServiceObjectDefinition = {
  name: "marketo_lead_attribute_definition",
  service_name: "MarketoLeadAttributeDefinition"
}

const MarketoActivityTypeIdMap: ServiceObjectDefinition = {
  name: "marketo_activity_type_id_map",
  service_name: "MarketoActivityTypeIdMap"
}

module.exports = {
  MarketoOutgoingCompany,
  MarketoIncomingCompany,
  MarketoOutgoingLead,
  MarketoIncomingLead,
  MarketoIncomingLeadActivity,
  MarketoIncomingStreamLead,
  MarketoLeadAttributeDefinition,
  MarketoActivityTypeIdMap
};
