/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

// TODO do some sort of field definition in here has well
// include types, abtraction for custom/unknown fields, and read/only
const MarketoOutgoingCompany: ServiceObjectDefinition = {
  service_name: "marketo_outgoing_company",
  name: "Company"
};

const MarketoIncomingCompany: ServiceObjectDefinition = {
  service_name: "marketo_incoming_company",
  name: "Company"
};

const MarketoOutgoingLead: ServiceObjectDefinition = {
  service_name: "marketo_outgoing_lead",
  name: "Lead"
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
  service_name: "marketo_incoming_lead",
  name: "Lead"
};

const MarketoIncomingStreamLead: ServiceObjectDefinition = {
  service_name: "marketo_incoming_stream_lead",
  name: "Lead",
  stream: "csv"
};

const MarketoIncomingLeadActivity: ServiceObjectDefinition = {
  service_name: "marketo_incoming_lead_activity",
  name: "Lead-Update"
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
  service_name: "marketo_lead_attribute_definition",
  name: "MarketoLeadAttributeDefinition"
}

const MarketoActivityTypeIdMap: ServiceObjectDefinition = {
  service_name: "marketo_activity_type_id_map",
  name: "MarketoActivityTypeIdMap"
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
