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
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-user-changes.json");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");

        // not doing lookup on id anymore, saving api call...
        scope
          .get("/api/v2/prospects/16")
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-lookup.json"));
        // scope
        //   .get("/api/v2/prospects/23")
        //   .reply(200, require("../fixtures/api-responses/outgoing-user-alberto-lookup.json"));
        // scope
        //   .get("/api/v2/prospects/15")
        //   .reply(200, require("../fixtures/api-responses/outgoing-user-darkknight-lookup.json"));

        // {"data":{"type":"prospect","id":16,"attributes":{"emails":["darth@darksideinc.com"],"custom20":"Description of darth vader"}}}
        scope
          .intercept('/api/v2/prospects/16', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-darth-patch.json"));

        // {"data":{"type":"prospect","id":23,"attributes":{"emails":["alberto@close.io"],"title":"Great Title","workPhones":["+18552567346"],"custom20":"some test data2"}}}
        scope
          .intercept('/api/v2/prospects/23', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-alberto-patch.json"));

        scope
          .intercept('/api/v2/prospects/15', 'PATCH')
          .reply(200, require("../fixtures/api-responses/outgoing-user-darkknight-patch.json"));
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
      // most of the remaining "whatevers" are returned from the nock endpoints or are tested in traits
      logs: [
        ["info", "outgoing.job.start", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}],
        ["info", "outgoing.user.skip", expect.objectContaining({ "subject_type": "user", "user_email": "bluth@close.io" }), expect.objectContaining({ "reason": "User is not present in any existing segment (segments).  Please add the user to an existing synchronized segment" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/16" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/23" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "PATCH","status": 200,"url": "/prospects/15" })],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "darth@darksideinc.com" }), expect.whatever()],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "alberto@close.io" }), expect.whatever()],
        ["info", "outgoing.user.success", expect.objectContaining({ "subject_type": "user", "user_email": "thedarkknight@close.io" }), expect.whatever()],
        ["info", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "incoming.user.success", expect.whatever(), expect.whatever()],
        ["info", "outgoing.job.success", expect.whatever(), {"jobName": "Outgoing Data", "type": "user"}]
      ],
      firehoseEvents: [
        ["traits", {"asUser": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}, "subjectType": "user"}, {"outreach/id": {"operation": "set", "value": 16}, "outreach/personalnote2": {"operation": "set", "value": "sith lord, don't mention padme"}}],
        ["traits", {"asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "user"}, {"outreach/custom2": {"operation": "set", "value": "Alberto Nodale"}, "outreach/id": {"operation": "set", "value": 23}}],
        ["traits", {"asUser": {"anonymous_id": "outreach:15", "email": "thedarkknight@close.io"}, "subjectType": "user"}, {"outreach/custom1": {"operation": "set", "value": "Bruce Wayne"}, "outreach/id": {"operation": "set", "value": 15}}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:20"}, "asUser": {"anonymous_id": "outreach:16", "email": "darth@darksideinc.com"}, "subjectType": "account"}, {}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:32"}, "asUser": {"anonymous_id": "outreach:23", "email": "alberto@close.io"}, "subjectType": "account"}, {}],
        ["traits", {"asAccount": {"anonymous_id": "outreach:28"}, "asUser": {"anonymous_id": "outreach:15", "email": "thedarkknight@close.io"}, "subjectType": "account"}, {}]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.outgoing.users", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1]
      ]
    });
  });
});
