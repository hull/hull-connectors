const _ = require("lodash");
const baseSmartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/account-update-noclearbit.json"));

module.exports = () => {
  const acctSegmentId = _.get(baseSmartNotifierPayload, "messages[0].account_segments[0].id");
  _.set(baseSmartNotifierPayload, "connector.private_settings.synchronized_segments", [acctSegmentId]);
  return baseSmartNotifierPayload;
};
