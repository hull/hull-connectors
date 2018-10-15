const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/user-entered-segment.json")
);

module.exports = () => {
  const accountSegmentId = _.get(
    notifierPayload,
    "messages[0].account_segments[0].id"
  );
  _.set(
    notifierPayload,
    "messages[0].account['closeio/id']",
    "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty"
  );
  _.set(
    notifierPayload,
    "connector.private_settings.synchronized_account_segments",
    [accountSegmentId]
  );

  return notifierPayload;
};
