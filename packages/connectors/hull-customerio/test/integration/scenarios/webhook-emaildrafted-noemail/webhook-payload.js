const _ = require("lodash");
const payload = _.cloneDeep(require("../../fixtures/webhook-payloads/email-drafted-noemail.json"));

module.exports = () => {
  return payload;
};
