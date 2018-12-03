// /* global describe, it, beforeEach, afterEach */
// @flow
/* global describe, it, beforeEach, afterEach */
const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.MAILCHIMP_CLIENT_ID = "1234";
process.env.MAILCHIMP_CLIENT_SECRET = "1234";

// const connector = {
//   id: "123456789012345678901234",
//   private_settings: {
//   }
// };
// const usersSegments = [
//   {
//     name: "testSegment",
//     id: "hullSegmentId"
//   }
// ];

it("should handle incoming webhook for subscribe event", () => {
  const email = "";
  return testScenario({
    connectorServer,
    connectorManifest
  }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
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
        ["debug", "incoming.webhook.received", {}, require("../fixtures/incoming-webhook-subscribe")],
        [
          "info",
          "incoming.user.success",
          {
            "subject_type": "user",
            "user_anonymous_id": "mailchimp:912348d606",
            "user_email": "subscribed@user.com"
          },
          {
            "traits": {
              "first_name": { operation: "setIfNull", "value": "First" },
              "last_name": { operation: "setIfNull", "value": "Last" },
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
            "asUser": {
              "anonymous_id": "mailchimp:912348d606",
              "email": "subscribed@user.com"
            },
            "subjectType": "user"
          },
          {
            "first_name": { "operation": "setIfNull", "value": "First" },
            "last_name": {"operation": "setIfNull", "value": "Last" },
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
        ["GET", expect.stringContaining("/api/v1/users_segments"), expect.whatever(), {}],
        ["GET", expect.stringContaining("/api/v1/accounts_segments"), expect.whatever(), {}]
      ]
    };
  });
});
