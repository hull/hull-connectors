const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/account-update.json")
);

module.exports = () => {
  const accountSegmentId = _.get(
    notifierPayload,
    "messages[0].account_segments[0].id"
  );
  _.set(
    notifierPayload,
    "connector.private_settings.synchronized_account_segments",
    [accountSegmentId]
  );

  return notifierPayload;
};
