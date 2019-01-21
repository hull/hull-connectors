const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/email-converted.json"));

module.exports = () => {
  return payload;
};
