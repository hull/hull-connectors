const sample = require( "../../samples/user-created");
const { triggerBuilder } = require("../lib");
const { getUserSegmentInputFields } = require("../lib/input-fields");
const { getUserAttributeOutputFields } = require("../lib/output-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes": { is_new: true },
  "user": required,
  "segments": validateSegments("user")
};

const user_created = triggerBuilder({
  getInputFields: getUserSegmentInputFields,
  getOutputFields: getUserAttributeOutputFields,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user is created.",
  entityType: "user",
  action: "created",
  hidden: true
});

module.exports = {
  user_created
};
