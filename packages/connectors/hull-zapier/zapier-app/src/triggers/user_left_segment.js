const sample = require("../../samples/user-left-segment");
const { triggerBuilder } = require("../lib");
const { getUserSegmentInputFields } = require("../lib/input-fields");
const { getUserAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes.segments.left": [required, validateSegments("user")]
};

const user_left_segment = triggerBuilder({
  getInputFields: getUserSegmentInputFields,
  getOutputFields: getUserAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user leaves a segment.",
  entityType: "user",
  action: "left_segment"
});

module.exports = {
  user_left_segment
};
