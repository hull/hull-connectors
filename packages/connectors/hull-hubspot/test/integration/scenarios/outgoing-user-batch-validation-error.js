// @flow
declare function describe(name: string, callback: Function): void;
declare function before(callback: Function): void;
declare function beforeEach(callback: Function): void;
declare function afterEach(callback: Function): void;
declare function it(name: string, callback: Function): void;
declare function test(name: string, callback: Function): void;

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


process.env.CLIENT_ID = "123";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["hullSegmentId"]
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should send out a new hull user to hubspot", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.batchHandler,
      handlerUrl: "batch",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
          "properties": [{
            "property": "hull_segments",
            "value": "testSegment"
          }],
          "email": "non-existing-property@hull.io"
        }, {
          "properties": [{
            "property": "hull_segments",
            "value": "testSegment"
          }],
          "email": "email@email.com"
        }]).reply(400, require("../fixtures/post-contact-batch-nonexisting-property"));

        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
          "properties": [{
            "property": "hull_segments",
            "value": "testSegment"
          }],
          "email": "email@email.com"
        }]).reply(202);
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          email: "non-existing-property@hull.io",
          segment_ids: ["hullSegmentId"]
        },
        {
          email,
          segment_ids: ["hullSegmentId"]
        }
      ],
      response: {},
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 2, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 400, "url": "/contacts/v1/contact/batch/" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/contacts/v1/contact/batch/" })],
        [
          "error",
          "outgoing.user.error",
          expect.objectContaining({
            "subject_type": "user",
            "user_email": "non-existing-property@hull.io",
          }),
          {
            error: "Property \"non-existing-property\" does not exist",
            hubspotWriteContact: {
              "properties": [{
                "property": "hull_segments",
                "value": "testSegment"
              }],
              "email": "non-existing-property@hull.io"
            }
          }
        ],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          {"email": "email@email.com", "properties": [{"property": "hull_segments", "value": "testSegment"}]}
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "connector.service_api.error", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: [
        ["GET", "/_users_batch", {}, {}],
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
