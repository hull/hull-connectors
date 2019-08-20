/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const HubspotOutgoingDeal: ServiceObjectDefinition = {
  service_name: "hubspot_outgoing_deal",
  name: "Deal"
};

const HubspotIncomingDeal: ServiceObjectDefinition = {
  service_name: "hubspot_incoming_deal",
  name: "Deal"
};

module.exports = {
  HubspotIncomingDeal,
  HubspotOutgoingDeal
};
