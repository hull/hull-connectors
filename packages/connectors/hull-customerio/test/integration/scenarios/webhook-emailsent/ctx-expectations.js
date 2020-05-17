module.exports = (ctxMock) => {
  const userData = {
    id: "1",
    email: "test@example.com"
  };
  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  const event = {
    context: {
      ip: "0"
    },
    created_at: 1585254331,
    event: "Email Sent",
    event_id: "01E4C8AY5K21N2QNRBD9YXJ13Z",
    properties: {
      campaign_id: 9,
      customer_id: "1",
      email_address: "test@example.com",
      email_id: "RPILAgABcRhIBqSp7kiPekGBIeVh",
      email_subject: "hello",
    }
  };

  expect(ctxMock.client.track.mock.calls).toHaveLength(1);
  expect(ctxMock.client.track.mock.calls[0])
    .toEqual([event.event, event.properties, event.context]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.debug.mock.calls[0])
    .toEqual(["incoming.event.success", { event }]);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(1);
  expect(ctxMock.metric.increment.mock.calls[0])
    .toEqual(["ship.incoming.events", 1]);
};
