const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/email-opened.json"));

module.exports = () => {
  return payload;
};
