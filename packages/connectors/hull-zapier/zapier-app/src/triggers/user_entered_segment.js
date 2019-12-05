const _ = require("lodash");
const sample = require("../../samples/user-entered-segment");
const { triggerBuilder } = require("../lib");
const { getUserSegmentInputFields } = require("../lib/input-fields");
const { getUserAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes.segments.entered": [required, validateSegments("user")]
};

const user_entered_segment = triggerBuilder({
  getInputFields: getUserSegmentInputFields,
  getOutputFields: getUserAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user enters a segment.",
  entityType: "user",
  action: "entered_segment",
  important: true
});

module.exports = {
  user_entered_segment
};
