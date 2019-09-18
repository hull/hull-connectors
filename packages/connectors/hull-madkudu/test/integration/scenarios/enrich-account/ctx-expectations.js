const _ = require("lodash");
const smartNotifierPayload = require("./smart-notifier-payload");

module.exports = (ctxMock) => {
  const accountData = _.cloneDeep(smartNotifierPayload().messages[0].account);

  expect(ctxMock.client.asAccount.mock.calls[0])
    .toEqual([_.pick(accountData, ["domain", "external_id", "id"])]);

  expect(ctxMock.client.traits.mock.calls).toHaveLength(1);
  expect(_.omit(ctxMock.client.traits.mock.calls[0][0], "fetched_at"))
    .toEqual({
      customer_fit_segment: "good",
      name: "MadKudu Inc",
      number_of_employees: 17000,
      signal_employee_count: "180",
      signal_web_traffic_volume: "medium",
      top_signals_positive: ["employee count", "web traffic volume"]
    });
  expect(ctxMock.client.traits.mock.calls[0][1]).toEqual({ source: "Madkudu" });

  expect(_.get(ctxMock.client.traits.mock.calls[0][0], "fetched_at", null)).toBeDefined();

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(2);
  expect(ctxMock.client.logger.debug.mock.calls[0])
    .toEqual(["outgoing.account.start", { operation: "fetchCompanyData" }]);
  expect(ctxMock.client.logger.debug.mock.calls[1][0]).toEqual("connector.service_api.call"); // Debug log for response time from superagent

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  const responseBody = {
    domain: "madkudu.com",
    object_type: "company",
    properties: {
      name: "MadKudu Inc",
      domain: "madkudu.com",
      location: {
        state: "California",
        state_code: "CA",
        country: "United States",
        country_code: "US",
        tags: ["english_speaking", "high_gdp_per_capita"]
      },
      number_of_employees: 17000,
      industry: "Software",
      customer_fit: {
        segment: "good",
        top_signals: [
          { name: "employee count", value: "180", type: "positive" },
          { name: "web traffic volume", value: "medium", type: "positive" }
        ]
      }
    }
  };
  expect(ctxMock.client.logger.info.mock.calls[0])
    .toEqual(["outgoing.account.success", {
      data: responseBody
    }]);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(2);
  expect(ctxMock.metric.increment.mock.calls[0])
    .toEqual(["ship.outgoing.account", 1]);
  expect(ctxMock.metric.increment.mock.calls[1])
    .toEqual(["ship.service_api.call", 1, ["method:POST", "url:https://api.madkudu.com/v1/companies", "status:200", "statusGroup:2xx", "endpoint:POST https://api.madkudu.com/v1/companies"]]);
};
