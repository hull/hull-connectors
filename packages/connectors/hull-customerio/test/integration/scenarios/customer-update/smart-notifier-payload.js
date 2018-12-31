const _ = require("lodash");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = () => {
  const userSegmentId = _.get(smartNotifierPayload, "messages[0].segments[0].id");
  _.set(smartNotifierPayload, "connector.private_settings.synchronized_segments", [userSegmentId]);
  _.set(smartNotifierPayload, "messages[0].events", []);

  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/created_at", _.get(smartNotifierPayload, "messages[0].user.created_at"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/email", _.get(smartNotifierPayload, "messages[0].user.email"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/id", _.get(smartNotifierPayload, "messages[0].user.email"));

  return smartNotifierPayload;
};
