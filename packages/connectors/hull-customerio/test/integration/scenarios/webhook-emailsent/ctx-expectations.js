module.exports = (ctxMock) => {
  const userData = {
    id: "5abc2de89ba6c1be560019e3",
    email: "sven+dt2@hull.io"
  };
  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  const event = {
    context: {
      ip: "0"
    },
    created_at: 1522283447,
    event: "Email Sent",
    event_id: "01C9QJM259SPWQF2JZ8GX9HY7J",
    properties: {
      campaign_id: "12",
      campaign_name: "Started Vault Trials - 1 - Welcome, Installing and Deploying Vault",
      customer_id: "5abc2de89ba6c1be560019e3",
      email_address: "Sven <sven+dt2@hull.io>",
      email_id: "ZI6aBAABYm8p-RzGk9KlbP_MSBwc",
      email_subject: "How Vault Enterprise trials work",
      template_id: "35"
    }
  };

  expect(ctxMock.client.track.mock.calls).toHaveLength(1);
  expect(ctxMock.client.track.mock.calls[0])
    .toEqual([event.event, event.properties, event.context]);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0])
    .toEqual(["incoming.event.success", { event }]);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(1);
  expect(ctxMock.metric.increment.mock.calls[0])
    .toEqual(["ship.incoming.events", 1]);
};
