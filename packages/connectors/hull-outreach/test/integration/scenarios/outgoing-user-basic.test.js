// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


test("send smart-notifier user update to outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-user-with-array-attribute.json");
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
          .intercept('/api/v2/prospects/23', 'PATCH', {"data":{"type":"prospect","id":23,"relationships":{"account":{"data":{"type":"account","id":14}}}, "attributes":{"emails":["alberto@close.io", "albertoman9@gmail.com"],"title":"Sales","workPhones":["+18552567346"], "custom10": "[\"Smugglers\"]"}}})
          .reply(200, require("../fixtures/api-responses/existing-prospect-updated.json"));
        return scope;
      },
      response: {
        flow_control: {
          type: "next",
        }
      },
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({"method": "GET", "status": 200, "url": "/prospects/", "vars": {}})],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({"method": "PATCH", "status": 200, "url": "/prospects/23", "vars": {}})],
        ["info", "outgoing.user.success", {
          "subject_type": "user",
          "request_id": expect.whatever(),
          "user_id": "userid",
          "user_email": "alberto@close.io"
        }, { "data": expect.whatever(), "type":"Prospect" }],
        ["debug", "incoming.user.success", {
          "subject_type": "user",
          "request_id": expect.whatever(),
          "user_email": "alberto@close.io",
          "user_anonymous_id": "outreach:23"
        }, {"data": expect.whatever(), "type": "Prospect" }],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "user"}, {"outreach/custom1": {"operation": "set", "value": null}, "outreach/custom2": {"operation": "set", "value": "Alberto Nodale"}, "outreach/id": {"operation": "set", "value": 23}, "outreach/stage": {"operation": "set", "value": 2 }, "outreach/owner": {"operation": "set", "value": 1 }, "outreach/personalnote2": {"operation": "set", "value": null }}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:32"}, "asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "account"}, {}]
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
