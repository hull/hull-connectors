/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const HubspotOutgoingDeal: ServiceObjectDefinition = {
  name: "hubspot_outgoing_deal",
  service_name: "Deal"
};

const HubspotIncomingDeal: ServiceObjectDefinition = {
  name: "hubspot_incoming_deal",
  service_name: "Deal"
};

module.exports = {
  HubspotIncomingDeal,
  HubspotOutgoingDeal
};
