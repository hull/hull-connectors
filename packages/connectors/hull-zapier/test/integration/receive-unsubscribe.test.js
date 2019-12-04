/* @flow */

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";

it("Receive Unsubscribe", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: [
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/1/",
              "action": "entered_segment",
              "entityType": "user"
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/unsubscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/1/",
              "action": "entered_segment",
              "entityType": "user"
            }
          );
      },
      response: expect.whatever(),
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents:[],
      metrics: [["increment", "connector.request", 1,]],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {
          "private_settings": {
            "triggers": []
          },
          "refresh_status": false
        }]
      ]
    };
  });
});


it("Receive Unsubscribe And Remove From Existing Subscriptions", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: [
            {
              "url": "https://hooks.zapier.com/hooks/standard/user-entered-segment/1/",
              "action": "entered_segment",
              "entityType": "user"
            },
            {
              "url": "https://hooks.zapier.com/hooks/standard/user-left-segment/1/",
              "action": "left_segment",
              "entityType": "user"
            },
            {
              "url": "https://hooks.zapier.com/hooks/standard/account-entered-segment/1/",
              "action": "entered_segment",
              "entityType": "account"
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/unsubscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/user-left-segment/1/",
              "action": "left_segment",
              "entityType": "user"
            }
          );
      },
      response: expect.whatever(),
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents:[],
      metrics: [["increment", "connector.request", 1,]],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, {
          "private_settings": {
            "triggers": [
              {
                "url": "https://hooks.zapier.com/hooks/standard/user-entered-segment/1/",
                "action": "entered_segment",
                "entityType": "user"
              },
              {
                "url": "https://hooks.zapier.com/hooks/standard/account-entered-segment/1/",
                "action": "entered_segment",
                "entityType": "account"
              }
            ]
          },
          "refresh_status": false
        }]
      ]
    };
  });
});


it("Receive unsubscribe that does not exist in Hull", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: [
            {
              "url": "https://hooks.zapier.com/hooks/standard/user-entered-segment/1/",
              "action": "entered_segment",
              "entityType": "user"
            },
            {
              "url": "https://hooks.zapier.com/hooks/standard/user-left-segment/1/",
              "action": "left_segment",
              "entityType": "user"
            },
            {
              "url": "https://hooks.zapier.com/hooks/standard/account-entered-segment/1/",
              "action": "entered_segment",
              "entityType": "account"
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/unsubscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "random-url.com",
              "action": "entered_segment",
              "entityType": "user"
            }
          );
      },
      response: expect.whatever(),
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents:[],
      metrics: [["increment", "connector.request", 1,]],
      platformApiCalls: [["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", { "shipId": "9993743b22d60dd829001999" }, {}]
      ]
    };
  });
});
