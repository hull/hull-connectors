// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token_fetched_at: 1419967066626,
    expires_in: 10,
    refresh_token: "123"
  }
};

it("Should return the no token error when calling the connector's API without a token", () => {
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "status",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"messages": ['No OAuth AccessToken found.  Please make sure to allow Hull to access your Hubspot data by clicking the \"Credentials & Actions\" button on the connector page and following the workflow provided'], "status": "error"},
      logs: [],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
      ],
      platformApiCalls: [
        ["PUT", "/api/v1/9993743b22d60dd829001999/status", {},
          {
            "messages":
              [
                'No OAuth AccessToken found.  Please make sure to allow Hull to access your Hubspot data by clicking the \"Credentials & Actions\" button on the connector page and following the workflow provided'
              ],
            "status": "error"
          }
        ]
      ]
    };
  });
});
