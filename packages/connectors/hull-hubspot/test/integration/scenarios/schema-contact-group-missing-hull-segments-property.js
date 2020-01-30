// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

import connectorConfig from "../../../server/config";
// Clone deep otherwise changes will affect other subsequent tests
const incomingData = _.cloneDeep(require("../fixtures/get-contacts-groups"));

let index = _.findIndex(incomingData, elem => elem.name === "hull");
incomingData[index].properties = [];

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10,
    refresh_token: "123",
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("Should return a custom attribute warning when missing the hull segments property", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
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
      response: {"messages": ["Hubspot is missing the hull_segments custom attribute. Initial sync with Hubspot may not have been completed yet. If this warning persists please contact your Hull Support."], "status": "warning"},
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
                "Hubspot is missing the hull_segments custom attribute. Initial sync with Hubspot may not have been completed yet. If this warning persists please contact your Hull Support."
              ],
            "status": 'warning'
          }
        ]
      ]
    };
  });
});
