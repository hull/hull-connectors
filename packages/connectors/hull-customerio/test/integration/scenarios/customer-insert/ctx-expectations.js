const _ = require("lodash");
const moment = require("moment");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = (ctxMock) => {
  const userData = _.get(smartNotifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  const customerData = {
    id: _.get(userData, "email"),
    email: _.get(userData, "email"),
    created_at: moment(_.get(userData, "created_at")).unix(),
    deleted_at: null
  };

  expect(_.omit(ctxMock.client.traits.mock.calls[0][0], "synced_at", "hash"))
    .toEqual(_.omit(customerData, "email"));
  expect(ctxMock.client.traits.mock.calls[0][0])
    .toHaveProperty("synced_at");
  expect(ctxMock.client.traits.mock.calls[0][0])
    .toHaveProperty("hash");
  expect(ctxMock.client.traits.mock.calls[0][1])
    .toEqual({ source: "customerio" });

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(2);
  expect(ctxMock.metric.increment.mock.calls[0]).toEqual(["ship.outgoing.users", 1]);
  expect(ctxMock.metric.increment.mock.calls[1]).toEqual(["ship.service_api.call", 1, [
    "method:PUT",
    "url:https://track.customer.io/api/v1/customers/{{id}}",
    "status:200",
    "statusGroup:2xx",
    "endpoint:PUT https://track.customer.io/api/v1/customers/{{id}}",
  ]]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(2); // debug calls from super-agent
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0][0])
    .toEqual("outgoing.user.success");
  expect(_.omit(ctxMock.client.logger.info.mock.calls[0][1], "data.synced_at", "data.hash", "data.hull_segments"))
    .toEqual({ data: _.omit(customerData, "deleted_at"), operation: "updateCustomer" });
  expect(ctxMock.client.logger.info.mock.calls[0][1])
    .toHaveProperty("data.hull_segments");
  expect(_.get(ctxMock.client.logger.info.mock.calls[0][1], "data.hull_segments")).toEqual(_.map(_.get(smartNotifierPayload, "messages[0].segments", []), "name"));
};
