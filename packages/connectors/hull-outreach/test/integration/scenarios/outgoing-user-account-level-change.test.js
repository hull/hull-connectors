// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";


const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


test("send smart-notifier user update to outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-account-changes-account-attribute-user-level.json");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope
          .get("/api/v2/prospects/?filter[emails]=alberto@close.io")
          .reply(200, require("../fixtures/api-responses/existing-prospect.json"));
        scope
          .intercept('/api/v2/prospects/23', 'PATCH', {"data":{"type":"prospect","id":23,"attributes":{"custom1":"newdomain.com","emails":["alberto@close.io","albertoman9@gmail.com"]}}})
          .reply(200, require("../fixtures/api-responses/existing-prospect-updated.json"));
        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10,
        }
      },
      logs: [
        ["info", "outgoing.job.start", {"request_id": expect.whatever()}, {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, expect.objectContaining({"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/", "vars": {}})],
        ["debug", "connector.service_api.call", {"request_id": expect.whatever()}, expect.objectContaining({"method": "PATCH", "responseTime": expect.whatever(), "status": 200, "url": "/prospects/23", "vars": {}})],
        ["info", "outgoing.user.success", expect.objectContaining({"request_id": expect.whatever(), "subject_type": "user", "user_email": "alberto@close.io", "user_id": "userid"}), { "data": {"data": {"attributes": {"emails": ["alberto@close.io", "albertoman9@gmail.com"], "custom1": "newdomain.com" }, "id": 23, "type": "prospect"}},
        "operation": "patch", type:"Prospect" }],
        ["info", "incoming.user.success", {
          "request_id": expect.whatever(),
          "subject_type": "user",
          "user_anonymous_id": "outreach:23",
          "user_email": "alberto@close.io"
        }, {"data": expect.whatever(), type: "Prospect"}],
        ["info", "outgoing.job.success", {"request_id": expect.whatever()}, {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "user"}, {"outreach/id": {"operation": "set", "value": 23}}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});
