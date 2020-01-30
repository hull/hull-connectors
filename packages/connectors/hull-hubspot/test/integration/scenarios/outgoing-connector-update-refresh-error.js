// @flow








const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

process.env.CLIENT_ID = "123",
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    refresh_token: "refreshToken",
    token_fetched_at: "1541670608956",
    expires_in: 10000,
    synchronized_user_segments: ["hullSegmentId"],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("should handle refresh token errors", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "ship:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com", {
          reqheaders: {
            Authorization: (headerValue) => {
              console.log("!!!!!! headerValue", headerValue);
              return false;
            }
          }
        });
        scope.get("/contacts/v2/groups?includeProperties=true").reply(401, {});
        scope.post("/oauth/v1/token", "refresh_token=refreshToken&client_id=123&client_secret=abc&redirect_uri=&grant_type=refresh_token")
            .reply(403, {
              status: "BAD_HUB",
              message: "missing or unknown hub id",
              correlationId: "24a279b9-eb45-493b-8a33-890e564d8e55",
              requestId: "a7ad53d51c4c97b41069e2c8e9d15d86"
            });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      messages: [
        connector
      ],
      response: {
        error: {
          code: "HULL_ERR_CONFIGURATION",
          message: "Failed to refresh access token, try to reauthorize the connector (error message: \"missing or unknown hub id\"\")",
          name: "ConfigurationError",
        },
        flow_control: {
          in: 6000,
          in_time: 10,
          size: 10,
          type: "retry"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "retrying query", expect.whatever(), expect.whatever()],
        ["debug", "access_token", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        [
          "error",
          "outgoing.job.error",
          expect.whatever(),
          {
            error: "Failed to refresh access token, try to reauthorize the connector (error message: \"missing or unknown hub id\"\")"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "connector.service_api.error", 1],
        ["increment", "ship.service_api.call", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "connector.service_api.error", 1],
        ["increment", "connector.transient_error", 1],
      ],
      platformApiCalls: []
    };
  });
});
