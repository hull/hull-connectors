// @flow
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.MAILCHIMP_CLIENT_ID = "1234";
process.env.MAILCHIMP_CLIENT_SECRET = "1234";
process.env.COMBINED = "true";

it("should handle incoming webhook for subscribe event", () => {
  const email = "";
  return testScenario(
    {
      manifest,
      connectorConfig
    },
    ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.incomingRequestHandler,
        externalIncomingRequest: ({
          superagent,
          connectorUrl,
          plainCredentials
        }) => {
          return superagent
            .post(`${connectorUrl}/mailchimp`)
            .type("form")
            .query(plainCredentials)
            .send(require("../fixtures/incoming-webhook-subscribe"));
        },
        externalApiMock: () => {},
        connector: {},
        usersSegments: [],
        accountsSegments: [],
        response: { ok: true, message: "Data processed" },
        logs: [
          [
            "debug",
            "incoming.webhook.received",
            {},
            require("../fixtures/incoming-webhook-subscribe")
          ],
          [
            "debug", "incoming.user.success",
            {
              subject_type: "user",
              user_anonymous_id: "mailchimp:912348d606",
              user_email: "subscribed@user.com"
            },
            {
              traits: {
                first_name: { operation: "setIfNull", value: "First" },
                last_name: { operation: "setIfNull", value: "Last" },
                "mailchimp/archived": false,
                "mailchimp/email": "subscribed@user.com",
                "mailchimp/fname": "First",
                "mailchimp/lname": "Last",
                "mailchimp/status": "subscribed",
                "mailchimp/subscribed": true,
                "mailchimp/unique_email_id": "912348d606"
              }
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              asUser: {
                anonymous_id: "mailchimp:912348d606",
                email: "subscribed@user.com"
              },
              subjectType: "user"
            },
            {
              first_name: { operation: "setIfNull", value: "First" },
              last_name: { operation: "setIfNull", value: "Last" },
              "mailchimp/archived": false,
              "mailchimp/email": "subscribed@user.com",
              "mailchimp/fname": "First",
              "mailchimp/lname": "Last",
              "mailchimp/status": "subscribed",
              "mailchimp/subscribed": true,
              "mailchimp/unique_email_id": "912348d606"
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.incoming.users", 1]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          [
            "GET",
            expect.stringContaining("/api/v1/users_segments"),
            expect.whatever(),
            {}
          ],
          [
            "GET",
            expect.stringContaining("/api/v1/accounts_segments"),
            expect.whatever(),
            {}
          ]
        ]
      };
    }
  );
});
