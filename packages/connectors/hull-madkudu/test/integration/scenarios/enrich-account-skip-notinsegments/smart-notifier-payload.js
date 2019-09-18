const _ = require("lodash");
const baseSmartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/account-update.json"));

module.exports = () => {
  _.set(baseSmartNotifierPayload, "connector.private_settings.synchronized_account_segments", ["definitelynotinthis123"]);
  return baseSmartNotifierPayload;
};
