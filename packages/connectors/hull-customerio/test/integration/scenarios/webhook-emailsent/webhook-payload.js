const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/email-sent.json"));

module.exports = () => {
  return payload;
};
