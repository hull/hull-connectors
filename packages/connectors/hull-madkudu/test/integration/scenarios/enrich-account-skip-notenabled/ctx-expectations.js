module.exports = (ctxMock) => {
  expect(ctxMock.client.asAccount.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(0);
  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0]).toEqual([
    "outgoing.account.skip",
    { reason: "Account is not in the whitelisted segments and will not be enriched with Madkudu data." }
  ]);
  expect(ctxMock.metric.increment.mock.calls).toHaveLength(0);
};
