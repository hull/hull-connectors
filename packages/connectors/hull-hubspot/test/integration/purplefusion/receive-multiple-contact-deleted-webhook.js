/* @flow */
import hubspotWebhookHandler from "../../../server/handlers/hubspot-webhook-handler";

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";


it("Receive Webhook - multiple contacts deleted payload", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      rawCustomRoutes: [
        {
          url: "/hubspot-webhook",
          handler: hubspotWebhookHandler,
          method: "post"
        }
      ],
      connector: {
        private_settings: {
          portal_id: "1234",
          mark_deleted_contacts: true
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/hubspot-webhook?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
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
              },
                {
                  "eventId": 2,
                  "subscriptionId": 162971,
                  "portalId": 6038822,
                  "occurredAt": 1567689104280,
                  "subscriptionType": "contact.deletion",
                  "attemptNumber": 0,
                  "objectId": 124,
                  "changeSource": "CRM",
                  "changeFlag": "DELETED"
                }]
          );
      },
      response: {},
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["debug", "incoming.user.success", { "subject_type": "user", "user_anonymous_id": "hubspot:123" },
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
        ["debug", "incoming.user.success", { "subject_type": "user", "user_anonymous_id": "hubspot:124" },
          {
            "data": {
              "eventId": 2,
              "subscriptionId": 162971,
              "portalId": 6038822,
              "occurredAt": 1567689104280,
              "subscriptionType": "contact.deletion",
              "attemptNumber": 0,
              "objectId": 124,
              "changeSource": "CRM",
              "changeFlag": "DELETED"
            },
            "type": "hubspot_webhook_payload"
          }
        ],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }
        ]
      ],
      firehoseEvents: [
        ["traits", { "asUser": { "anonymous_id": "hubspot:123" }, "subjectType": "user" }, { "hubspot/deleted_at": 1567689104280, "hubspot/id": null }],
        ["traits", { "asUser": { "anonymous_id": "hubspot:124" }, "subjectType": "user" }, { "hubspot/deleted_at": 1567689104280, "hubspot/id": null }]
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
