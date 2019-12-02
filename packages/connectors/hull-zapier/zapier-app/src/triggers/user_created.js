const sample = require( "../../samples/user-created");
const { triggerBuilder } = require("../lib");
const { getUserSegments, getEmpty } = require("../lib/input-fields");
const { performTrigger } = require("../lib/perform-trigger");
const { validateSegments, required } = require("../lib/validate");

const validations = {
  "changes": { is_new: true },
  "user": required,
  "segments": validateSegments("user")
};

const user_created = triggerBuilder({
  getInputFields: getUserSegments,
  performTrigger: performTrigger(validations),
  sample,
  description: "Triggers when a user is created.",
  entityType: "user",
  action: "created"
});

module.exports = {
  user_created
};
