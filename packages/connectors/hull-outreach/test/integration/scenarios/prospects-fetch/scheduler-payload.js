const _ = require("lodash");
const schedulerPayload = _.cloneDeep(
  require("../../fixtures/scheduler-payload.json")
);

module.exports = () => {
  return schedulerPayload;
};
