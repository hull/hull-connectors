const _ = require("lodash");
const moment = require("moment");
const HashUtil = require("../../../../server/lib/sync-agent/hash-util");
const SHARED_MESSAGES = require("../../../../server/lib/shared-messages");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = (ctxMock) => {
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/created_at", _.get(smartNotifierPayload, "messages[0].user.created_at"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/email", _.get(smartNotifierPayload, "messages[0].user.email"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/id", _.get(smartNotifierPayload, "messages[0].user.email"));
  const segmentIds = _.get(smartNotifierPayload, "messages[0].user.segment_ids", []);

  const customerDataX = {
    id: _.get(smartNotifierPayload, "messages[0].user.email"),
    email: _.get(smartNotifierPayload, "messages[0].user.email"),
    created_at: moment(_.get(smartNotifierPayload, "messages[0].user.created_at")).unix(),
    hull_segments: _.map(_.filter(_.get(smartNotifierPayload, "messages[0].segments", []), (seg) => {
      return _.includes(segmentIds, seg.id);
    }), "name")
  };

  const hashUtil = new HashUtil();
  const hash = hashUtil.hash(customerDataX);
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/hash", hash);

  _.set(smartNotifierPayload, "messages[0].user.segment_ids", []);
  _.set(smartNotifierPayload, "messages[0].segments", []);

  const userData = _.get(smartNotifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  expect(ctxMock.client.traits.mock.calls).toHaveLength(0);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(1); // debug call - counters toSkip, etc.
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0][0])
    .toEqual("outgoing.user.skip");
  expect(ctxMock.client.logger.info.mock.calls[0][1])
    .toEqual({ reason: SHARED_MESSAGES.SKIP_NOTINSEGMENTS });
};
