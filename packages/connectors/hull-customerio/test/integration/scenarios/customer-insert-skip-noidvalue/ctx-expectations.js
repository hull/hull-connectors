const _ = require("lodash");
const SHARED_MESSAGES = require("../../../../server/lib/shared-messages");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = (ctxMock) => {
  _.unset(smartNotifierPayload, "messages[0].user.external_id");
  const userData = _.get(smartNotifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

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
    .toEqual({ reason: SHARED_MESSAGES.SKIP_NOIDVALUE });
};
