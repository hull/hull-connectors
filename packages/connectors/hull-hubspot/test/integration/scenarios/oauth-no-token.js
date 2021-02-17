// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token_fetched_at: 1419967066626,
    expires_in: 10,
    refresh_token: "123",
    synchronized_user_segments: [
      "5bffc38f625718d58b000004"
    ],
    synchronized_account_segments: [
      "5bffc38f625718d58b000005"
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("Should return the no token \"ok\" message when calling the connector's API without a token", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
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
      response: {"messages": ['Connector has not been authenticated. Please make sure to allow Hull to access your Hubspot data by going to the "Settings" tab and clicking "Login to your Hubspot account" in the "Connect to Hubspot" section'], "status": "setupRequired"},
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
                "Connector has not been authenticated. Please make sure to allow Hull to access your Hubspot data by going to the \"Settings\" tab and clicking \"Login to your Hubspot account\" in the \"Connect to Hubspot\" section"
              ],
            "status": "setupRequired"
          }
        ]
      ]
    };
  });
});
