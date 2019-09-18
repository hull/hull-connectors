const _ = require("lodash");
const smartNotifierPayload = require("./smart-notifier-payload");
const SHARED_MESSAGES = require("../../../../server/lib/shared-messages");

module.exports = (ctxMock) => {
  const accountData = _.cloneDeep(smartNotifierPayload().messages[0].account);

  expect(ctxMock.client.asAccount.mock.calls[0])
    .toEqual([_.pick(accountData, ["domain", "external_id", "id"])]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0])
    .toEqual(["outgoing.account.skip", {
      reason: SHARED_MESSAGES.SKIP_ACCOUNT_ALREADYENRICHED
    }]);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(0);
};
