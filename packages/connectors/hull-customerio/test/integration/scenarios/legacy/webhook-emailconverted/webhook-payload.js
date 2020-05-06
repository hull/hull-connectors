const _ = require("lodash");
const payload = _.cloneDeep(require("../../../fixtures/legacy/webhook-payloads/email-converted.json"));

module.exports = () => {
  return payload;
};
