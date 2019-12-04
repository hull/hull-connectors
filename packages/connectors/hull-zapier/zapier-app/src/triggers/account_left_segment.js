const sample = require("../../samples/account-left-segment");
const { triggerBuilder } = require("../lib");
const { getAccountSegments } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes.account_segments.left": [required, validateSegments("account")]
};

const account_left_segment = triggerBuilder({
  getInputFields: getAccountSegments,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when an account leaves a segment.",
  entityType: "account",
  action: "left_segment",
  hidden: true
});

module.exports = {
  account_left_segment
};
