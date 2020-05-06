const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/customer-subscribed.json"));

module.exports = () => {
  return payload;
};
