const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/email-delivered.json"));

module.exports = () => {
  return payload;
};
