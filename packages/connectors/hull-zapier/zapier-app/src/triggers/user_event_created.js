const sample = require("../../samples/user-event-created");
const { triggerBuilder } = require("../lib");
const { getUserEventInputFields } = require("../lib/input-fields");
const { getUserAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateEvents, validateSegments } = require("../lib/validate");

const validations = {
  events: validateEvents,
  segments: validateSegments("user"),
  account_segments: validateSegments("account")
};

const user_event_created = triggerBuilder({
  getInputFields: getUserEventInputFields,
  getOutputFields: getUserAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user event is created.",
  entityType: "user_event",
  action: "created",
  hidden: true
});

module.exports = {
  user_event_created
};
