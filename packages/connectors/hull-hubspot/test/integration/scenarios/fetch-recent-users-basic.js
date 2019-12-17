// @flow








const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
import connectorConfig from "../../../server/config";


process.env.OVERRIDE_HUBSPOT_URL = "";

const incomingData = require("../fixtures/get-contacts-recently-updated");

const connector = {
  private_settings: {
    token: "hubToken",
    last_fetch_at: 1419967066626,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("should fetch recent users using settings", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-contacts",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent")
          .query({
            // timeOffset: null,
            // vidOffset: null,
            property: "email",
            count: 100
          })
          .reply(200, incomingData);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent")
          .query({
            timeOffset: 1484854580823,
            vidOffset: 3714024,
            property: "email",
            count: 100
          })
          .reply(200, { contacts: [], "has-more": false, "time-offset": 0 });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        ["info", "incoming.job.start", expect.whatever(), {jobName: "Incoming Data", type: "webpayload"}],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "GET",
            status: 200,
            url: "/contacts/v2/groups",
          })
        ],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/properties/v1/companies/groups" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/contacts/v1/lists/recently_updated/contacts/recent" })],
        ["debug", "saveContacts", {}, 2],
        [
          "debug",
          "incoming.user",
          {},
          {
            claims: { email: "testingapis@hubspot.com", anonymous_id: "hubspot:3234574" },
            traits: { "hubspot/id": 3234574 }
          }
        ],
        [
          "debug", "incoming.account.link.skip",
          {
            subject_type: "user", user_email: "testingapis@hubspot.com", user_anonymous_id: "hubspot:3234574"
          },
          {
            reason: "incoming linking is disabled, you can enabled it in the settings"
          }
        ],
        [
          "debug",
          "incoming.user",
          {},
          {
            claims: {
              anonymous_id: "hubspot:3714024",
              email: "new-email@hubspot.com"
            },
            traits: {
              "hubspot/id": 3714024
            }
          }
        ],
        [
          "debug", "incoming.account.link.skip",
          {
            subject_type: "user",
            user_anonymous_id: "hubspot:3714024",
            user_email: "new-email@hubspot.com",
          },
          {
            reason: "incoming linking is disabled, you can enabled it in the settings"
          }
        ],
        [
          "debug", "incoming.user.success",
          {
            subject_type: "user",
            user_anonymous_id: "hubspot:3234574",
            user_email: "testingapis@hubspot.com",
          },
          {
            traits: {
              "hubspot/id": 3234574
            }
          }
        ],
        [
          "debug", "incoming.user.success",
          {
            subject_type: "user",
            user_anonymous_id: "hubspot:3714024",
            user_email: "new-email@hubspot.com",
          },
          {
            traits: {
              "hubspot/id": 3714024
            }
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {},
          expect.objectContaining({
            method: "GET",
            status: 200,
            url: "/contacts/v1/lists/recently_updated/contacts/recent"
          })
        ],
        [
          "info",
          "incoming.job.success",
          {},
          {
            "jobName": "Incoming Data",
            "type": "webpayload"
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            "asUser": {
              email: "testingapis@hubspot.com",
              anonymous_id: "hubspot:3234574"
            },
            "subjectType": "user",
          },
          {
            "hubspot/id": 3234574
          }
        ],
        [
          "traits",
          {
            "asUser": {
              anonymous_id: "hubspot:3714024",
              email: "new-email@hubspot.com"
            },
            subjectType: "user",
          },
          {
            "hubspot/id": 3714024,
          },
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.incoming.users", 2],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/app", {}, {}],
        [
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings": {
              "last_fetch_timestamp": expect.any(Number),
              "last_fetch_at": expect.whatever(),
              "token": "hubToken",
              "mark_deleted_contacts": false,
              "mark_deleted_companies": false
            },
            "refresh_status": false
          }
        ],
        ["GET", "/api/v1/app", {}, {}],
        [
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings": {
              "last_fetch_at": null,
              "token": "hubToken",
              "mark_deleted_contacts": false,
              "mark_deleted_companies": false
            },
            "refresh_status": false
          }
        ]
      ]
    };
  });
});
