const sample = require( "../../samples/account.json");
const { triggerBuilder } = require("../lib");
const { performEntityDeletedTrigger } = require("../lib/perform-trigger");

const account_deleted = triggerBuilder({
  performTrigger: performEntityDeletedTrigger,
  sample,
  description: "Triggers when an account is deleted.",
  entityType: "account",
  action: "deleted"
});

module.exports = {
  account_deleted
};
