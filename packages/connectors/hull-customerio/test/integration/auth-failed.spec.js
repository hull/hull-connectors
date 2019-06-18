// @flow
/* global describe, it, beforeEach, afterEach */
import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
    private_settings: {
      api_key: "bar",
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    }
};

it("Should set status to check Site ID and API Key if authentication returns status 401", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
        return {
            handlerType: handlers.scheduleHandler,
            handlerUrl: "status",
            externalApiMock: () => {
                const scope = nock("https://track.customer.io");
                scope.get("/auth")
                  .reply(401, {
                      meta: {
                          error: "Unauthorized request"
                      }
                  })
            },
            connector,
            usersSegments: [],
            accountsSegments: [],
            response: {"messages": ['Invalid Credentials: Verify Site ID and API Key in Settings.'], "status": "error"},
            logs: [
              ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 401, "url": "https://track.customer.io/auth", "vars": {}}],
              // ["debug", "connector.status", {}, {"messages": ["Invalid Credentials: Verify Site ID and API Key in Settings."], "status": "error"}]
            ],
            firehoseEvents: [],
            metrics: [
              ["increment", "connector.request", 1], ["increment", "ship.service_api.call", 1],
              ["value", "connector.service_api.response_time", expect.whatever()], ["increment", "connector.service_api.error", 1]
            ],
            platformApiCalls: [
                ["PUT", "/api/v1/9993743b22d60dd829001999/status", {}, {
                  "messages": ["Invalid Credentials: Verify Site ID and API Key in Settings."],
                  "status": "error"
                }]
              ]
        }
    });
});
