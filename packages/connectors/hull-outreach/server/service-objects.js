/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";


const OutreachProspectRead: ServiceObjectDefinition = {
  name: "outreach_incoming_prospect",
  service_name: "Prospect"
};

const OutreachProspectWrite: ServiceObjectDefinition = {
  name: "outreach_outgoing_prospect",
  service_name: "Prospect"
};

const OutreachAccountRead: ServiceObjectDefinition = {
  name: "outreach_incoming_account",
  service_name: "Prospect"
};

const OutreachAccountWrite: ServiceObjectDefinition = {
  name: "outreach_outgoing_account",
  service_name: "Prospect"
};

const WebhookPayload: ServiceObjectDefinition = {
  name: "outreach_incoming_webhook",
  service_name: "Webhook"
};


module.exports = {
  WebhookPayload,
  OutreachProspectRead,
  OutreachProspectWrite,
  OutreachAccountWrite,
  OutreachAccountRead
};
