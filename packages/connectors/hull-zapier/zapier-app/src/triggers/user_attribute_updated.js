const _ = require("lodash");
const sample = require("../../samples/user-attribute-updated");
const { triggerBuilder } = require("../lib");
const { getUserAttributeInputFields } = require("../lib/input-fields");
const { getUserAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateChanges, validateSegments } = require("../lib/validate");

const validations = {
  changes: validateChanges([ "user", "account" ]),
  segments: validateSegments("user"),
  account_segments: validateSegments("account")
};

const user_attribute_updated = triggerBuilder({
  getInputFields: getUserAttributeInputFields,
  getOutputFields: getUserAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user attribute is updated.",
  entityType: "user",
  action: "attribute_updated"
});

module.exports = {
  user_attribute_updated
};
