const sample = require( "../../samples/account-created");
const { triggerBuilder } = require("../lib");
const { getAccountSegmentInputFields } = require("../lib/input-fields");
const { getAccountAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes": { is_new: true },
  "account": required,
  "account_segments": validateSegments("account")
};

const account_created = triggerBuilder({
  getInputFields: getAccountSegmentInputFields,
  getOutputFields: getAccountAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when an account is created.",
  entityType: "account",
  action: "created",
  hidden: true
});

module.exports = {
  account_created
};
