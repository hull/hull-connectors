const sample = require("../../samples/account-entered-segment");
const { triggerBuilder } = require("../lib");
const { getAccountSegmentInputFields } = require("../lib/input-fields");
const { getAccountAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes.account_segments.entered": [required, validateSegments("account")]
};

const account_entered_segment = triggerBuilder({
  getInputFields: getAccountSegmentInputFields,
  getOutputFields: getAccountAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when an account enters a segment.",
  entityType: "account",
  action: "entered_segment",
  hidden: true
});

module.exports = {
  account_entered_segment
};
