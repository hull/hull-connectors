const _ = require("lodash");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = () => {
  const userSegmentId = _.get(smartNotifierPayload, "messages[0].segments[0].id");
  _.set(smartNotifierPayload, "connector.private_settings.synchronized_segments", [userSegmentId]);
  _.set(smartNotifierPayload, "messages[0].events", []);

  _.set(smartNotifierPayload, "messages[0].user.customerio/email", _.get(smartNotifierPayload, "messages[0].user.email"));

  return smartNotifierPayload;
};
