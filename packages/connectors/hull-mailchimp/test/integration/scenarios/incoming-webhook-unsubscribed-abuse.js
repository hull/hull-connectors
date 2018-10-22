// /* global describe, it, beforeEach, afterEach */
// @flow
/* global describe, it, beforeEach, afterEach */
const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");

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

it("should handle incoming webhook for unsubscribe event", () => {
  const email = "";
  return testScenario({
    connectorServer
  }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.requestsBufferHandler,
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/mailchimp`)
          .type("form")
          .query(plainCredentials)
          .send(require("../fixtures/incoming-webhook-unsubscribe-abuse"));
      },
      externalApiMock: () => {},
      connector: {},
      usersSegments: [],
      accountsSegments: [],
      response: { ok: true, message: "Data processed" },
      logs: [
        ["debug", "incoming.webhook.received", {}, require("../fixtures/incoming-webhook-unsubscribe-abuse")],
        [
          "info",
          "incoming.user.success",
          {
            "subject_type": "user",
            "user_anonymous_id": "mailchimp:123416b037",
            "user_email": "user@abuse.com"
          },
          {
            "traits": {
              "first_name": { operation: "setIfNull", "value": "User" },
              "last_name": { operation: "setIfNull", "value": "Abuse" },
              "mailchimp/address_addr1": "",
              "mailchimp/address_addr2": "",
              "mailchimp/address_city": "",
              "mailchimp/address_country": "MR",
              "mailchimp/address_state": "",
              "mailchimp/address_zip": "",
              "mailchimp/email": "user@abuse.com",
              "mailchimp/fname": "User",
              "mailchimp/lname": "Abuse",
              "mailchimp/mmerge13": "12/10/2017",
              "mailchimp/mmerge14": "active",
              "mailchimp/mmerge15": "11/10/2017",
              "mailchimp/mmerge16": "active",
              "mailchimp/mmerge30": "",
              "mailchimp/ordertotal": "",
              "mailchimp/phone": "",
              "mailchimp/status": "unsubscribed",
              "mailchimp/subscribed": false,
              "mailchimp/tags": "",
              "mailchimp/unique_email_id": "123416b037"
            }
          }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            "asUser": {
              "anonymous_id": "mailchimp:123416b037",
              "email": "user@abuse.com"
            },
            "subjectType": "user"
          },
          {
            "first_name": { operation: "setIfNull", "value": "User" },
            "last_name": { operation: "setIfNull", "value": "Abuse" },
            "mailchimp/address_addr1": "",
            "mailchimp/address_addr2": "",
            "mailchimp/address_city": "",
            "mailchimp/address_country": "MR",
            "mailchimp/address_state": "",
            "mailchimp/address_zip": "",
            "mailchimp/email": "user@abuse.com",
            "mailchimp/fname": "User",
            "mailchimp/lname": "Abuse",
            "mailchimp/mmerge13": "12/10/2017",
            "mailchimp/mmerge14": "active",
            "mailchimp/mmerge15": "11/10/2017",
            "mailchimp/mmerge16": "active",
            "mailchimp/mmerge30": "",
            "mailchimp/ordertotal": "",
            "mailchimp/phone": "",
            "mailchimp/status": "unsubscribed",
            "mailchimp/subscribed": false,
            "mailchimp/tags": "",
            "mailchimp/unique_email_id": "123416b037"
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
