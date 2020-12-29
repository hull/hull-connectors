// @flow
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

describe("Ensure Hook Tests", () => {

  it("should manage webhooks", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "ship:update",
        connector: {
          private_settings: {
            access_token: "access_token_1234",
            organization: "testing-org",
            receive_events: true
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.calendly.com");

          scope
            .get("/webhook_subscriptions?organization=https://api.calendly.com/organizations/testing-org&scope=organization")
            .reply(200, {
              "collection": [
                {
                  "callback_url": "https://testing.ngrok.io?ship=ship_id_1&secret=ship_secret_1&organization=localhost",
                  "created_at": "2020-12-28T18:30:42.301736Z",
                  "creator": "https://api.calendly.com/users/CEAASHJH5PTXCJOZ",
                  "events": [
                    "invitee.canceled",
                    "invitee.created"
                  ],
                  "organization": "https://api.calendly.com/organizations/testing-org",
                  "retry_started_at": null,
                  "scope": "organization",
                  "state": "active",
                  "updated_at": "2020-12-28T18:30:42.301736Z",
                  "uri": "https://api.calendly.com/webhook_subscriptions/FGCGWAOA22G6KYTU",
                  "user": null
                }
              ],
              "pagination": {
                "count": 1,
                "next_page": null
              }
            });

          scope
            .post("/webhook_subscriptions?organization=https://api.calendly.com/organizations/testing-org&scope=organization",
              {
                //"url": "https://localhost/webhooks?organization=localhost%3A51002&secret=1234&ship=9993743b22d60dd829001999",
                "events": [
                  "invitee.created",
                  "invitee.canceled"
                ],
                "organization": "https://api.calendly.com/organizations/testing-org",
                "scope": "organization"
              }
            ).reply(200, {
            "resource": {
              "callback_url": "https://localhost/webhooks?organization=localhost%3A51002&secret=1234&ship=9993743b22d60dd829001999",
              "created_at": "2020-12-28T19:25:23.858075Z",
              "creator": "https://api.calendly.com/users/CEAASHJH5PTXCJOZ",
              "events": [
                "invitee.canceled",
                "invitee.created"
              ],
              "organization": "https://api.calendly.com/organizations/testing-org",
              "retry_started_at": null,
              "scope": "organization",
              "state": "active",
              "updated_at": "2020-12-28T19:25:23.858075Z",
              "uri": "https://api.calendly.com/webhook_subscriptions/ABAHHA7WS3QHXOQY",
              "user": null
            }
          });

          scope
            .delete("/webhook_subscriptions/FGCGWAOA22G6KYTU")
            .reply(200);


          return scope;
        },
        messages: [],
        response: { "flow_control": { "type": "next", } },
        logs: [
          [
            "info",
            "outgoing.job.start",
            { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "/webhook_subscriptions?organization=https://api.calendly.com/organizations/testing-org&scope=organization",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "/webhook_subscriptions?organization=https://api.calendly.com/organizations/testing-org&scope=organization",
              "status": 200,
              "vars": {}
            }
          ],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            {
              "responseTime": expect.whatever(),
              "method": "DELETE",
              "url": "/webhook_subscriptions/FGCGWAOA22G6KYTU",
              "status": 200,
              "vars": {}
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() },
            { "jobName": "Outgoing Data", "type": "webpayload" }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});
