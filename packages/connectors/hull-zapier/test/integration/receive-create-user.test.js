/* @flow */

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";

it("Receive Create User From Zapier", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
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
          .post(`${connectorUrl}/create?ship=${plainCredentials.ship}&organization=${plainCredentials.organization}&secret=1234`)
          .send(
            {
              "entityType": "user",
              "attributes": {
                "pipedrive/department": "marketing",
                "name": "Andy Hull",
                "pipedrive/id": "pipedrive_id"
              },
              "claims": {
                "external_id": "123",
                "email": "email_1@gmail.com"
              }
            }
          );
      },
      response: expect.whatever(),
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents:[
        ["traits",
          {
            "asUser": {
              "external_id": "123",
              "email": "email_1@gmail.com"
            },
            "subjectType": "user"
          },
          {
            "pipedrive/department": "marketing",
            "name": "Andy Hull",
            "pipedrive/id": "pipedrive_id"
          }
        ]
      ],
      metrics: [["increment", "connector.request", 1,]],
      platformApiCalls: [
        [
          "GET",
          "/api/v1/app",
          {},
          {}
        ],
        [
          "GET",
          "/api/v1/users_segments?shipId=9993743b22d60dd829001999",
          {
            "shipId": expect.whatever()
          },
          {}
        ],
        [
          "GET",
          "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
          {
            "shipId": expect.whatever()
          },
          {}
        ]
      ]
    };
  });
});
