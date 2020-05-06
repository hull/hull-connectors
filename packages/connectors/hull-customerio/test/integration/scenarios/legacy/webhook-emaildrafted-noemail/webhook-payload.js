const _ = require("lodash");
const payload = _.cloneDeep(require("../../../fixtures/legacy/webhook-payloads/email-drafted-noemail.json"));

module.exports = () => {
  return payload;
};
