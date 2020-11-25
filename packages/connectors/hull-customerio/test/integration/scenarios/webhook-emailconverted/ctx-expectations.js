module.exports = (ctxMock) => {
  const userData = {
    id: "test-1",
    email: "test@example.com"
  };
  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  const event = {
    context: {
      ip: "0"
    },
    created_at: 1234567890,
    event: "Email Converted",
    event_id: "01ASDG7S9P6MYWPTJ78JND9GDC",
    properties: {
      campaign_id: 1424,
      customer_id: "test-1",
      email_address: "test@example.com",
      email_id: "SA13dk35ja7s8d9kja3s2dASdasd==",
      email_subject: "Thanks for joining!",
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
