const _ = require("lodash");
const moment = require("moment");
const HashUtil = require("../../../../server/lib/sync-agent/hash-util");
const smartNotifierPayload = _.cloneDeep(require("../../fixtures/smart-notifier-payloads/user-update-withevent.json"));

module.exports = (ctxMock) => {
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/created_at", _.get(smartNotifierPayload, "messages[0].user.created_at"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/email", _.get(smartNotifierPayload, "messages[0].user.email"));
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/id", _.get(smartNotifierPayload, "messages[0].user.email"));
  const segmentIds = _.get(smartNotifierPayload, "messages[0].user.segment_ids", []);

  const customerDataX = {
    id: _.get(smartNotifierPayload, "messages[0].user.email"),
    email: _.get(smartNotifierPayload, "messages[0].user.email"),
    created_at: moment(_.get(smartNotifierPayload, "messages[0].user.created_at")).unix(),
    hull_segments: _.map(_.filter(_.get(smartNotifierPayload, "messages[0].segments", []), (seg) => {
      return _.includes(segmentIds, seg.id);
    }), "name")
  };

  const hashUtil = new HashUtil();
  const hash = hashUtil.hash(customerDataX);
  _.set(smartNotifierPayload, "messages[0].user.traits_customerio/hash", hash);

  const userData = _.get(smartNotifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0])
    .toEqual([userData]);

  expect(_.omit(ctxMock.client.traits.mock.calls[0][0], "synced_at", "hash", "deleted_at"))
    .toEqual(_.omit(customerDataX, "email", "hull_segments"));
  expect(ctxMock.client.traits.mock.calls[0][0])
    .toHaveProperty("synced_at");
  expect(ctxMock.client.traits.mock.calls[0][0])
    .toHaveProperty("hash");
  expect(ctxMock.client.traits.mock.calls[0][1])
    .toEqual({ source: "customerio" });

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(4);
  expect(ctxMock.metric.increment.mock.calls[0]).toEqual(["ship.outgoing.users", 1]);
  expect(ctxMock.metric.increment.mock.calls[1]).toEqual(["ship.service_api.call", 1, [
    "method:PUT",
    "url:https://track.customer.io/api/v1/customers/{{id}}",
    "status:200",
    "statusGroup:2xx",
    "endpoint:PUT https://track.customer.io/api/v1/customers/{{id}}",
  ]]);
  expect(ctxMock.metric.increment.mock.calls[2]).toEqual(["ship.outgoing.events", 1]);
  expect(ctxMock.metric.increment.mock.calls[3]).toEqual(["ship.service_api.call", 1, [
    "method:POST",
    "url:https://track.customer.io/api/v1/customers/{{customerId}}/events",
    "status:200",
    "statusGroup:2xx",
    "endpoint:POST https://track.customer.io/api/v1/customers/{{customerId}}/events",
  ]]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(3); // debug call from superagent (x2) and counters
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  const hullEvent = _.get(smartNotifierPayload, "messages[0].events[0]", {});
  const eventsCustomerLogData = [
    hullEvent.event
  ];

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(2);
  expect(ctxMock.client.logger.info.mock.calls[0][0])
    .toEqual("outgoing.user.success");
  expect(_.omit(ctxMock.client.logger.info.mock.calls[0][1], "data.synced_at", "data.hash"))
    .toEqual({ data: _.omit(customerDataX, "deleted_at"), operation: "updateCustomer" });

  expect(ctxMock.client.logger.info.mock.calls[1][0])
    .toEqual("outgoing.event.success");
  expect(ctxMock.client.logger.info.mock.calls[1][1])
    .toEqual({ events: eventsCustomerLogData, operation: "sendEvent" });
};
