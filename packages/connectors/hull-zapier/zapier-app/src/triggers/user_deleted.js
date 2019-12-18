const sample = require( "../../samples/user.json");
const { triggerBuilder } = require("../lib");
const { performEntityDeletedTrigger } = require("../lib/perform-trigger");

const user_deleted = triggerBuilder({
  performTrigger: performEntityDeletedTrigger,
  sample,
  description: "Triggers when a user is deleted",
  entityType: "user",
  action: "deleted",
  hidden: true
});

module.exports = {
  user_deleted
};
