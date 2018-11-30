const _ = require("lodash");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = () => {
  const userSegmentId = _.get(smartNotifierPayload, "messages[0].segments[0].id");
  _.set(smartNotifierPayload, "connector.private_settings.synchronized_segments", [userSegmentId]);
  _.set(smartNotifierPayload, "connector.private_settings.user_id_mapping", "external_id");
  _.unset(smartNotifierPayload, "messages[0].user.external_id");
  _.set(smartNotifierPayload, "messages[0].events", []);

  return smartNotifierPayload;
};
