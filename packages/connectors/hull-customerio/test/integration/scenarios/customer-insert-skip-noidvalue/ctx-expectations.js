const _ = require("lodash");
const moment = require("moment");
const SHARED_MESSAGES = require("../../../../server/lib/shared-messages");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = (ctxMock) => {
  _.unset(smartNotifierPayload, "messages[0].user.external_id");
  const userData = _.get(smartNotifierPayload, "messages[0].user");

  _.set(userData, "customerio/created_at", _.get(userData, "created_at"));
  _.set(userData, "customerio/email", _.get(userData, "email"));
  _.set(userData, "customerio/id", _.get(userData, "email"));

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  expect(ctxMock.client.traits.mock.calls).toHaveLength(0);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(2); // debug call - counters toSkip, etc.
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.debug.mock.calls[1][0])
    .toEqual("outgoing.user.skip");
  expect(ctxMock.client.logger.debug.mock.calls[1][1])
    .toEqual({ reason: SHARED_MESSAGES.SKIP_NOIDVALUE });
};
