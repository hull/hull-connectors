// @flow








const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";


process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("should not attempt to work if the token is missing", () => {
  const email = "email@email.com";
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email
          },
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        ["error", "connector.configuration.error", expect.whatever(), { errors: "connector is not configured" }]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1]
      ],
      platformApiCalls: []
    };
  });
});
