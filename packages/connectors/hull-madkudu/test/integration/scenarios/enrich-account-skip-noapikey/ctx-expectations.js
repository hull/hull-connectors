module.exports = (ctxMock) => {
  expect(ctxMock.client.asAccount.mock.calls).toHaveLength(0);
  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(0);
  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(0);
  expect(ctxMock.metric.increment.mock.calls).toHaveLength(0);
};
