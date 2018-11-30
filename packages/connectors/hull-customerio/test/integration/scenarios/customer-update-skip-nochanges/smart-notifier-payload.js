const _ = require("lodash");
const moment = require("moment");
const HashUtil = require("../../../../server/lib/sync-agent/hash-util");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = () => {
  const userSegmentId = _.get(smartNotifierPayload, "messages[0].segments[0].id");
  _.set(smartNotifierPayload, "connector.private_settings.synchronized_segments", [userSegmentId]);
  _.set(smartNotifierPayload, "messages[0].events", []);

  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/created_at", _.get(smartNotifierPayload, "messages[0].user.created_at"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/email", _.get(smartNotifierPayload, "messages[0].user.email"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/id", _.get(smartNotifierPayload, "messages[0].user.email"));

  const segmentIds = _.get(smartNotifierPayload, "messages[0].user.segment_ids", []);

  const customerData = {
    id: _.get(smartNotifierPayload, "messages[0].user.email"),
    email: _.get(smartNotifierPayload, "messages[0].user.email"),
    created_at: moment(_.get(smartNotifierPayload, "messages[0].user.created_at")).unix(),
    hull_segments: _.map(_.filter(_.get(smartNotifierPayload, "messages[0].segments", []), (seg) => {
      return _.includes(segmentIds, seg.id);
    }), "name")
  };

  const hashUtil = new HashUtil();
  const hash = hashUtil.hash(customerData);
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/hash", hash);

  return smartNotifierPayload;
};
