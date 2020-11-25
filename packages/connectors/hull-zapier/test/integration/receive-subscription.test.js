/* @flow */

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";

it("Receive New Subscription", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: []
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/subscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/1/",
              "action": "entered_segment",
              "entityType": "user",
              "inputData": {
                "user_segments": [ "segment_1" ]
              }
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
                "serviceAction": {
                  "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
                },
                "inputData": {
                  "entered_user_segments": [ "segment_1" ]
                }
              }
            ]
          },
          "refresh_status": false
        }]
      ]
    };
  });
});


it("Receive New Subscription And Merge With Existing Subscriptions", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: [
            {
              "serviceAction": {
                "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
              },
              "inputData": {
                "entered_user_segments": [ "segment_1" ]
              }
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/subscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/2/",
              "action": "entered_segment",
              "entityType": "user",
              "inputData": {
                "user_segments": [ "segment_2" ]
              }
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
                "serviceAction": {
                  "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
                },
                "inputData": {
                  "entered_user_segments": [ "segment_1" ]
                }
              },
              {
                "serviceAction": {
                  "webhook": "https://hooks.zapier.com/hooks/standard/1/2/"
                },
                "inputData": {
                  "entered_user_segments": [ "segment_2" ]
                }
              }
            ]
          },
          "refresh_status": false
        }]
      ]
    };
  });
});

it("Receive New Subscription And Unable To Merge With Existing Subscriptions", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: [
            {
              "serviceAction": {
                "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
              },
              "inputData": {
                "entered_user_segments": [ "segment_1" ]
              }
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/subscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/1/",
              "action": "entered_segment",
              "entityType": "user",
              "inputData": {
                "user_segments": [ "segment_2" ]
              }
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

it("Receive New User Attribute Updated Subscription", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.incomingRequestHandler,
      connector: {
        private_settings: {
          triggers: []
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalIncomingRequest: ({ superagent, connectorUrl, plainCredentials }) => {
        return superagent
          .post(`${connectorUrl}/subscribe?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "url": "https://hooks.zapier.com/hooks/standard/1/1/",
              "action": "attribute_updated",
              "entityType": "user",
              "inputData": {
                "user_segments": [ "segment_1" ],
                "account_segments": [ "account_segment_1" ],
                "user_attributes": [ "pipedrive/department" ],
                "account_attributes": [ "pipedrive/industry", "num_employees" ]
              }
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
                "serviceAction": {
                  "webhook": "https://hooks.zapier.com/hooks/standard/1/1/"
                },
                "inputData": {
                  "user_segments": [ "segment_1" ],
                  "account_segments": [ "account_segment_1" ],
                  "user_attribute_updated": [ "pipedrive/department" ],
                  "account_attribute_updated": [ "pipedrive/industry", "num_employees" ]
                }
              }
            ]
          },
          "refresh_status": false
        }]
      ]
    };
  });
});
