const payload = require("../../fixtures/webhook-payloads/email-drafted-noemail.json");

const SHARED_MESSAGES = require("../../../../server/lib/shared-messages");

module.exports = (ctxMock) => {
  expect(ctxMock.client.asUser.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.error.mock.calls[0])
    .toEqual(["incoming.event.error", { reason: SHARED_MESSAGES.ERROR_NOUSERIDENT, data: payload }]);
};
