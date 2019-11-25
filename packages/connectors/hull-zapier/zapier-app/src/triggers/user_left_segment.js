const sample = require("../../samples/user-left-segment");
const { triggerBuilder } = require("../lib");
const { getUserSegments } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes.segments.left": [required, validateSegments("user")]
};

const user_left_segment = triggerBuilder({
  getInputFields: getUserSegments,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user leaves a segment.",
  entityType: "user",
  action: "left_segment"
});

module.exports = {
  user_left_segment
};
