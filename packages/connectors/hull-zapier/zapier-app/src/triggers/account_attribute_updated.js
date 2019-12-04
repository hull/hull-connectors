const _ = require("lodash");
const sample = require("../../samples/account-attribute-updated");
const { triggerBuilder } = require("../lib");
const { getAccountAttributes } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateChanges, validateSegments } = require("../lib/validate");

const validations = {
  changes: validateChanges([ "account" ]),
  account_segments: validateSegments("account")
};

const account_attribute_updated = triggerBuilder({
  getInputFields: getAccountAttributes,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when an account attribute is updated.",
  entityType: "account",
  action: "attribute_updated",
  hidden: true
});

module.exports = {
  account_attribute_updated
};
