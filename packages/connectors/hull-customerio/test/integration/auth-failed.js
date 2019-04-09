const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.SECRET = "abc";

const connectorServer = require("../../server/server");
const connectorManifest = require("../../manifest");

const connector = {
    private_settings: {
      api_key: "bar",
      site_id: "foo",
      synchronized_segments: ["cio leads"]
    }
};

it("Should set status to check Site ID and API Key if authentication returns status 401", () => {
    return testScenario({connectorServer, connectorManifest}, ({ handlers, nock, expect }) => {
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
            logs: [],
            firehoseEvents: [],
            metrics: [],
            platformApiCalls: [
                ["PUT", "/api/v1/9993743b22d60dd829001999/status", {},
                  {
                    "messages":
                      [
                        'Authorization issue. Please reauthenticate with Jeqn Michel by clicking the \"Credentials and Actions\" button in the upper right hand section of the connector settings.  Then either click \"Continue to Hubspot\" or \"Start over\"'
                      ],
                    "status": "error"
                  }
                ]
              ]
        }
    });
})