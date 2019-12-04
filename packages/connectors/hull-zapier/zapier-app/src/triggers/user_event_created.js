const sample = require("../../samples/user-event-created");
const { triggerBuilder } = require("../lib");
const { getUserEventSchema } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateEvents, validateSegments } = require("../lib/validate");

const validations = {
  events: validateEvents,
  segments: validateSegments("user"),
  account_segments: validateSegments("account")
};

const user_event_created = triggerBuilder({
  getInputFields: getUserEventSchema,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user event is created.",
  entityType: "user_event",
  action: "created"
});

module.exports = {
  user_event_created
};
