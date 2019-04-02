// @flow








const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


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
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
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
        }).reply(200, require("../fixtures/post-companies"));
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
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({ method: "POST", status: 200, url: "/companies/v2/domains/{{domain}}/companies", vars: { domain: "hull.io" } })
        ],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 200, "url": "/companies/v2/companies/" })],
        [
          "info",
          "outgoing.account.success",
          expect.objectContaining({ "subject_type": "account", "account_domain": domain }),
          {
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
      firehoseEvents: [
        [
          "traits",
          {
            "asAccount": {
              "domain": "hull.io",
            },
            "subjectType": "account",
          },
          {
            "hubspot/id": 266234266,
            "name": {
              "operation": "setIfNull",
              "value": "A company name"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
