import { HullIncomingUser } from "hull-connector-framework/src/purplefusion/hull-service-objects";

const {
  CalendlyWebhookEventRead
} = require("./service-objects");

const EVENT_ACTION = {
  TRAITS: "traits",
  TRACK: "track"
};

const EVENT_MAPPING = {
  "invitee.created": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "payload",
    "webhookType": CalendlyWebhookEventRead,
    "transformTo": HullIncomingUser,
    "eventName": "Invitee Created Event",
    "properties": {
      "cancel_url": "payload.cancel_url",
      "created_at": "payload.created_at",
      "email": "payload.email",
      "event": "payload.event",
      "name": "payload.name",
      "new_invitee": "payload.new_invitee",
      "old_invitee": "payload.old_invitee",
      "questions_and_answers": "payload.questions_and_answers",
      "reschedule_url": "payload.reschedule_url",
      "rescheduled": "payload.rescheduled",
      "status": "payload.status",
      "text_reminder_number": "payload.text_reminder_number",
      "timezone": "payload.timezone",
      "tracking": "payload.tracking",
      "updated_at": "payload.updated_at",
      "uri": "payload.uri"
    },
    "context": {
      "event_type": "event"
    }
  },
  "invitee.canceled": {
    "action": EVENT_ACTION.TRACK,
    "pathToEntity": "payload",
    "webhookType": CalendlyWebhookEventRead,
    "transformTo": HullIncomingUser,
    "eventName": "Invitee Canceled Event",
    "properties": {
      "cancel_url": "payload.cancel_url",
      "created_at": "payload.created_at",
      "email": "payload.email",
      "event": "payload.event",
      "name": "payload.name",
      "new_invitee": "payload.new_invitee",
      "old_invitee": "payload.old_invitee",
      "questions_and_answers": "payload.questions_and_answers",
      "reschedule_url": "payload.reschedule_url",
      "rescheduled": "payload.rescheduled",
      "status": "payload.status",
      "text_reminder_number": "payload.text_reminder_number",
      "timezone": "payload.timezone",
      "tracking": "payload.tracking",
      "updated_at": "payload.updated_at",
      "uri": "payload.uri"
    },
    "context": {
      "event_type": "event"
    }
  }
}

module.exports = {
  EVENT_MAPPING
}
