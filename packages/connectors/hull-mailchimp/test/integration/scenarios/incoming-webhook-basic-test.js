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

it("should handle incoming webhook GET call", () => {
  const email = "";
  return testScenario({
    connectorServer
  }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.requestsBufferHandler,
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .get(`${connectorUrl}/mailchimp`)
          .query(plainCredentials)
          .send({ ping: true });
      },
      externalApiMock: () => {},
      connector: {},
      usersSegments: [],
      accountsSegments: [],
      response: { ok: true, message: "Webhook registered" },
      logs: [],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", expect.stringContaining("/api/v1/users_segments"), expect.whatever(), {}],
        ["GET", expect.stringContaining("/api/v1/accounts_segments"), expect.whatever(), {}]
      ]
    };
  });
});
