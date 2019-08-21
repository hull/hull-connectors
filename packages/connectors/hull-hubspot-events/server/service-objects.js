/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const HubspotIncomingEmailEvents: ServiceObjectDefinition = {
  name: "hubspot_incoming_email_events",
  service_name: "EmailEvents"
};

const HubspotIncomingEmailEvent: ServiceObjectDefinition = {
  name: "hubspot_incoming_email_event",
  service_name: "EmailEvent"
};

const HubspotEmailCampaign: ServiceObjectDefinition = {
  name: "hubspot_email_campaign",
  service_name: "EmailCampaign"
};

const HubspotMarketingEmail: ServiceObjectDefinition = {
  name: "hubspot_marketing_email",
  service_name: "MarketingEmail"
};

module.exports = {
  HubspotIncomingEmailEvent,
  HubspotIncomingEmailEvents,
  HubspotEmailCampaign,
  HubspotMarketingEmail
};
