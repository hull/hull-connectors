// @flow
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

declare function describe(name: string, callback: Function): void;
declare function before(callback: Function): void;
declare function beforeEach(callback: Function): void;
declare function afterEach(callback: Function): void;
declare function it(name: string, callback: Function): void;
declare function test(name: string, callback: Function): void;

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
          .intercept('/api/v2/prospects/23', 'PATCH', {"data":{"type":"prospect","id":23,"attributes":{"emails":["alberto@close.io", "albertoman9@gmail.com"],"title":"Sales","workPhones":["+18552567346"]}}})
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
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({"method": "GET", "status": 200, "url": "/prospects/", "vars": {}})],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({"method": "PATCH", "status": 200, "url": "/prospects/23", "vars": {}})],
        ["info", "outgoing.user.success", expect.whatever(), { "data": {"data": {"attributes": {"emails": ["alberto@close.io", "albertoman9@gmail.com"], "title": "Sales", "workPhones": ["+18552567346"]}, "id": 23, "type": "prospect"}},
        "operation": "patch", "response": require("../fixtures/api-responses/existing-prospect-updated.json").data, type:"Prospect" }],
        ["info", "incoming.user.success", expect.whatever(), {"data": {"accountIdent": { "anonymous_id": "outreach:32" }, "attributes": {"outreach/custom2": {"operation": "set", "value": "Alberto Nodale"}, "outreach/id": {"operation": "set", "value": 23 }}, "ident": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}}}],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "user"}, {"outreach/custom2": {"operation": "set", "value": "Alberto Nodale"}, "outreach/id": {"operation": "set", "value": 23}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:32"}, "asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "account"}, {}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.incoming.users", 1]
      ]
    });
  });
});
