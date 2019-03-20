// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");
const incomingData = require("../fixtures/get-contacts-groups");

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10,
    refresh_token: "123",
    synchronized_user_segments: [
      "5bffc38f625718d58b000004"
    ]
  }
};

it("Should return a synchronized user/account segments \"ok\" message when no account segments are given in the manifest", () => {
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "status",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, incomingData);
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"messages": ['No users or accounts will be sent from Hull to Hubspot because there are no whitelisted segments configured. If you want to enable outgoing traffic, please visit the connector settings page and add segments to be sent to Hubspot, otherwise please ignore this notification.'], "status": "ok"},
      logs: [
        ["debug", "connector.service_api.call", {}, {"method": "GET", "responseTime": expect.whatever(), "status": 200, "url": "/contacts/v2/groups", "vars": {}}]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: [
        ["PUT", "/api/v1/9993743b22d60dd829001999/status", {},
          {
            "messages":
              [
                'No users or accounts will be sent from Hull to Hubspot because there are no whitelisted segments configured. If you want to enable outgoing traffic, please visit the connector settings page and add segments to be sent to Hubspot, otherwise please ignore this notification.'
              ],
            "status": "ok"
          }
        ]
      ]
    };
  });
});
