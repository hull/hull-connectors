const _ = require("lodash");
const smartNotifierPayload = require("./smart-notifier-payload");

module.exports = (ctxMock) => {
  const accountData = _.cloneDeep(smartNotifierPayload().messages[0].account);

  expect(ctxMock.client.asAccount.mock.calls[0])
    .toEqual([_.pick(accountData, ["domain", "external_id", "id"])]);

  expect(ctxMock.client.traits.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(2);
  expect(ctxMock.client.logger.debug.mock.calls[0])
    .toEqual(["outgoing.account.start", { operation: "fetchCompanyData" }]);
  expect(ctxMock.client.logger.debug.mock.calls[1][0]).toEqual("connector.service_api.call"); // Debug log for response time from superagent

  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(1);
  const responseBody = {
    domain: "madkudu.com",
    object_type: "company",
    properties: null
  };
  expect(ctxMock.client.logger.error.mock.calls[0])
    .toEqual(["outgoing.account.error", {
      message: "Failed to process Madkudu response",
      data: responseBody
    }]);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(2);
  expect(ctxMock.metric.increment.mock.calls[0])
    .toEqual(["ship.outgoing.account", 1]);
  expect(ctxMock.metric.increment.mock.calls[1])
    .toEqual(["ship.service_api.call", 1, ["method:POST", "url:https://api.madkudu.com/v1/companies", "status:200", "statusGroup:2xx", "endpoint:POST https://api.madkudu.com/v1/companies"]]);
};
