const _ = require("lodash");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = () => {
  const userSegmentId = _.get(smartNotifierPayload, "messages[0].segments[0].id");
  _.set(smartNotifierPayload, "connector.private_settings.synchronized_segments", [userSegmentId]);
  const range = _.range(45);
  const attributes = _.zipObject(range.map(i => `traits_foo_${i}`), range.map(i => `value${i} dynamic generated content`));

  _.set(smartNotifierPayload, "connector.private_settings.synchronized_attributes", _.keys(attributes));

  _.forIn(attributes, (val, key) => {
    _.set(smartNotifierPayload, `messages[0].user.${key}`, val);
  });
  _.set(smartNotifierPayload, "messages[0].events", []);

  return smartNotifierPayload;
};
