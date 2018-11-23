// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["hullSegmentId"]
  }
};
const accountsSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should send out a new hull account to hubspot", () => {
  const domain = "hull.io";
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/companies/v2/domains/hull.io/companies", {
          requestOptions: {
            properties: ["domain", "hs_lastmodifieddate", "name"]
          }
        }).reply(200, {
          results: []
        });
        scope.post("/companies/v2/companies/?auditId=Hull", {
          "properties": [{
            "name": "hull_segments",
            "value": "testSegment"
          }, {
            "name": "domain",
            "value": "hull.io"
          }]
        }).reply(400, require("../fixtures/post-companies-nonexisting-property"));
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments,
      messages: [
        {
          account: {
            domain
          },
          account_segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 200, "url": "/companies/v2/domains/hull.io/companies" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 400, "url": "/companies/v2/companies/" })],
        [
          "error",
          "outgoing.account.error",
          expect.objectContaining({ "subject_type": "account", "account_domain": domain }),
          {
            error: {
              "status": "error",
              "message": "Property values were not valid",
              "correlationId": "72b84514-5dd3-4bd6-a12d-50a07966181f",
              "validationResults": [
                {
                  "isValid": false,
                  "message": "Property \"non-existing-property\" does not exist",
                  "error": "PROPERTY_DOESNT_EXIST",
                  "name": "non-existing-property"
                }
              ],
              "requestId": "156dd7c3965247bc8c073a02ab1d2f9b"
            },
            hubspotWriteCompany: {
              "properties": [{
                "name": "hull_segments",
                "value": "testSegment"
              }, {
                "name": "domain",
                "value": "hull.io"
              }]
            },
            operation: "insert"
          }
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
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "connector.service_api.error", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
