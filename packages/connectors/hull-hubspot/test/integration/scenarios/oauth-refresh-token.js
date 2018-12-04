// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.OVERRIDE_HUBSPOT_URL = "";

const incomingData = require("../fixtures/get-contacts-recently-updated");

const connector = {
  private_settings: {
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10
  }
};

it("should handle error during token refresh", () => {
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "monitor/checkToken",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deffered"},
      logs: [
        [
          "debug",
          "access_token",
          {},
          expect.whatever()
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "connector.transient_error", 1]
      ],
      platformApiCalls: []
    };
  });
});
