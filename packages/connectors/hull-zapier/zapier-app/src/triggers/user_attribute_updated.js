const _ = require("lodash");
const sample = require("../../samples/user-attribute-updated");
const { triggerBuilder } = require("../lib");
const { getUserAttributes } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateChanges, validateSegments } = require("../lib/validate");

const validations = {
  changes: validateChanges([ "user", "account" ]),
  segments: validateSegments("user"),
  account_segments: validateSegments("account")
};

const user_attribute_updated = triggerBuilder({
  getInputFields: getUserAttributes,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user attribute is updated.",
  entityType: "user",
  action: "attribute_updated"
});

module.exports = {
  user_attribute_updated
};
