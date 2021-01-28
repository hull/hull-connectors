/* @flow */

import type { ServiceObjectDefinition } from "hull-connector-framework/src/purplefusion/types";

const CalendlyWebhookEventRead: ServiceObjectDefinition = {
  service_name: "calendly_webhook_event_read",
  name: "Event"
};

module.exports = {
  CalendlyWebhookEventRead
};
