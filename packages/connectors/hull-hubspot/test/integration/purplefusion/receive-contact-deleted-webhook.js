/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


it("Receive Webhook - contact deleted payload ", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      handlerUrl: "incoming-webhooks-handler",
      connector: {
        private_settings: {
          portal_id: "1234"
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/webhooks/hull-hubspot-webhook?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
              [{
                "eventId": 1,
                "subscriptionId": 162971,
                "portalId": 6038822,
                "occurredAt": 1567689104280,
                "subscriptionType": "contact.deletion",
                "attemptNumber": 0,
                "objectId": 123,
                "changeSource": "CRM",
                "changeFlag": "DELETED"
              }]
          );
      },
      response: { "ok": true },
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["info", "incoming.user.success", { "subject_type": "user", "user_id": "123" },
          {
            "data": {
              "eventId": 1,
              "subscriptionId": 162971,
              "portalId": 6038822,
              "occurredAt": 1567689104280,
              "subscriptionType": "contact.deletion",
              "attemptNumber": 0,
              "objectId": 123,
              "changeSource": "CRM",
              "changeFlag": "DELETED"
            },
            "type": "hubspot_webhook_payload"
          }
        ],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["traits",
          { "asUser": { "id": 123 },
            "subjectType": "user" },
          { "hubspot/deleted_at": 1567689104280 }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1,]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
      ]
    };
  });
});
