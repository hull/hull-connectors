// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";


process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["someOtherSegment"],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const accountsSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should filter out accounts based on segments", () => {
  const domain = "hull.io";
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
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
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments,
      messages: [
        {
          account: {
            domain,
            id: "1"
          },
          account_segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 0, "toSkip": 1, "toUpdate": 0}],
        [
          "debug",
          "outgoing.account.skip",
          expect.objectContaining({ "subject_type": "account", "account_domain": domain }),
          {
            "reason": "Account doesn't match outgoing filter"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});
