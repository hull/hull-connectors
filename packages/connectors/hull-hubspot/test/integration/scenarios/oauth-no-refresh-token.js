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
    token: "hubToken",
    token_fetched_at: 1419967066626,
    expires_in: 10,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("Should return the no OAuth credentials error when calling the connector's API without a refresh token", () => {
  return testScenario(
    { manifest, connectorConfig },
    ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "status",
        externalApiMock: () => {
          const scope = nock("https://api.hubapi.com");
          scope
            .get("/contacts/v2/groups?includeProperties=true")
            .reply(401, []);
          return scope;
        },
        connector,
        usersSegments: [],
        accountsSegments: [],
        response: {
          messages: [
            'Error in authenticating with Hubspot.  Hubspot service did not return the proper OAuth Credentials.  Please reauthenticate with Hubspot by clicking "Credentials & Actions" and then click "Start Over".  If it happens again, please contact Hull Support.'
          ],
          status: "setupRequired"
        },
        logs: [
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "GET",
              responseTime: expect.whatever(),
              status: 401,
              url: "/contacts/v2/groups",
              vars: {}
            }
          ],
          [
            "debug",
            "access_token",
            {},
            {
              expires_at: expect.whatever(),
              expires_in: expect.whatever(),
              fetched_at: expect.whatever(),
              utc_now: expect.whatever(),
              will_expire_in: expect.whatever(),
              will_expire_soon: true
            }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "connector.service_api.error", 1]
        ],
        platformApiCalls: [
          [
            "PUT",
            "/api/v1/9993743b22d60dd829001999/status",
            {},
            {
              messages: [
                'Error in authenticating with Hubspot.  Hubspot service did not return the proper OAuth Credentials.  Please reauthenticate with Hubspot by clicking "Credentials & Actions" and then click "Start Over".  If it happens again, please contact Hull Support.'
              ],
              status: "setupRequired"
            }
          ]
        ]
      };
    }
  );
});
