const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/user-update.json")
);
const apiResponse = _.cloneDeep(
  require("../../fixtures/api-responses/contact-post.json")
);

module.exports = ctxMock => {
  const usrData = _.get(notifierPayload, "messages[0].user");

  expect(ctxMock.client.asUser.mock.calls[0]).toEqual([usrData]);

  const usrTraits = {
    "closeio/id": { operation: "set", value: _.get(apiResponse, "id") },
    "closeio/name": { operation: "set", value: _.get(usrData, "name") },
    "name": { operation: "setIfNull", value: _.get(usrData, "name") },
    "closeio/email_office": {
      operation: "set",
      value: _.get(usrData, "email")
    },
    "closeio/lead_id": {
      operation: "set",
      value: "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo"
    }
  };

  expect(ctxMock.client.traits.mock.calls[0][0]).toEqual(usrTraits);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(3);
  expect(ctxMock.metric.increment.mock.calls).toHaveLength(3);
  expect(ctxMock.metric.increment.mock.calls[0]).toEqual([
    "ship.service_api.call",
    1,
    [
      "method:GET",
      "url:https://app.close.io/api/v1/status/lead/",
      "status:200",
      "statusGroup:2xx",
      "endpoint:GET https://app.close.io/api/v1/status/lead/"
    ]
  ]);
  expect(ctxMock.metric.increment.mock.calls[1]).toEqual([
    "ship.service_api.call",
    1,
    [
      "method:GET",
      "url:https://app.close.io/api/v1/custom_fields/lead/",
      "status:200",
      "statusGroup:2xx",
      "endpoint:GET https://app.close.io/api/v1/custom_fields/lead/"
    ]
  ]);
  expect(ctxMock.metric.increment.mock.calls[2]).toEqual([
    "ship.service_api.call",
    1,
    [
      "method:POST",
      "url:https://app.close.io/api/v1/contact/",
      "status:200",
      "statusGroup:2xx",
      "endpoint:POST https://app.close.io/api/v1/contact/"
    ]
  ]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(3); // debug calls from super-agent
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0][0]).toEqual(
    "outgoing.user.success"
  );
};
