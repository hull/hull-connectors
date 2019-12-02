/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";


const OutreachProspectRead: ServiceObjectDefinition = {
  service_name: "outreach_incoming_prospect",
  name: "Prospect"
};

const OutreachProspectWrite: ServiceObjectDefinition = {
  service_name: "outreach_outgoing_prospect",
  name: "Prospect"
};

const OutreachAccountRead: ServiceObjectDefinition = {
  service_name: "outreach_incoming_account",
  name: "Account"
};

const OutreachAccountWrite: ServiceObjectDefinition = {
  service_name: "outreach_outgoing_account",
  name: "Account"
};

const OutreachEventRead: ServiceObjectDefinition = {
  service_name: "outreach_incoming_event",
  name: "Event"
};

const OutreachWebEventRead: ServiceObjectDefinition = {
  service_name: "outreach_incoming_web_event",
  name: "Event"
};

module.exports = {
  OutreachProspectRead,
  OutreachProspectWrite,
  OutreachAccountWrite,
  OutreachAccountRead,
  OutreachEventRead,
  OutreachWebEventRead
};
