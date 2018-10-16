const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/user-update.json")
);

module.exports = () => {
  const accountSegmentId = _.get(
    notifierPayload,
    "messages[0].account_segments[0].id"
  );
  _.set(
    notifierPayload,
    "messages[0].account['closeio/id']",
    "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo"
  );
  _.set(
    notifierPayload,
    "connector.private_settings.synchronized_account_segments",
    [accountSegmentId]
  );

  return notifierPayload;
};
