/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const PipedrivePersonRead: ServiceObjectDefinition = {
  service_name: "pipedrive_incoming_person",
  name: "Person"
};

const PipedrivePersonWrite: ServiceObjectDefinition = {
  service_name: "pipedrive_outgoing_person",
  name: "Person"
};

const PipedriveOrgRead: ServiceObjectDefinition = {
  service_name: "pipedrive_incoming_org",
  name: "Org"
};

const PipedriveOrgWrite: ServiceObjectDefinition = {
  service_name: "pipedrive_outgoing_org",
  name: "Org"
};

const PipedriveAttributeDefinition: ServiceObjectDefinition = {
  service_name: "pipedrive_attribute_definition",
  name: "PipedriveAttributeDefinition"
};

module.exports = {
  PipedrivePersonRead,
  PipedrivePersonWrite,
  PipedriveOrgWrite,
  PipedriveOrgRead,
  PipedriveAttributeDefinition
};
