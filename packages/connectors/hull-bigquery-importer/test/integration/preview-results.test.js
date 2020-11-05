// @flow
import connectorConfig from "../../server/config";
import { encrypt } from "hull/src/utils/crypto";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("BigQuery Import Results Test", () => {
  it("should test query using BigQuery api", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "run",
        connector: {
          private_settings: {
            import_type: "users",
            import_interval: "180",
            token_expires_in: 3599,
            token_fetched_at: "2020-08-25T10:00:45Z",
            access_token: "acccessToken",
            refresh_token: "refreshToken",
            query:
              "SELECT email, first_name as `fname` FROM `286213.my_dataset_example.my_users` LIMIT 1",
            project_id: "projectId",
            job_id: null,
            user_claims: [
              { hull: "email", service: "email" },
              { hull: "external_id", service: "external_id" }
            ],
            last_sync_at: 1234
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalIncomingRequest: async ({
          superagent,
          connectorUrl,
          config,
          plainCredentials
        }) => {
          const token = encrypt(plainCredentials, config.hostSecret);
          try {
            return await superagent.post(`${connectorUrl}/run/${token}`);
          } catch (err) {
            console.log(err);
            throw err;
          }
        },
        externalApiMock: () => {
          const scope = nock("https://bigquery.googleapis.com/bigquery/v2");

          scope
            .post("/projects/projectId/queries")
            .reply(200, {
              "kind": "bigquery#getQueryResultsResponse",
              "etag": "kEnWbAjByZaf0wodkfFfIQ==",
              "schema": {
                "fields": [
                  {
                    "name": "email",
                    "type": "STRING",
                    "mode": "NULLABLE"
                  },
                  {
                    "name": "fname",
                    "type": "STRING",
                    "mode": "NULLABLE"
                  }
                ]
              },
              "jobReference": {
                "projectId": "propane-ripsaw-286213",
                "jobId": "hull_import_5f3c15f30fe58e2647c7d54e_1598289329",
                "location": "US"
              },
              "totalRows": "2",
              "rows": [
                {
                  "f": [
                    {
                      "v": "cwilloughwayay@ning.com"
                    },
                    {
                      "v": "Cristobal"
                    }
                  ]
                },
                {
                  "f": [
                    {
                      "v": "rgozzettg1@huffingtonpost.com"
                    },
                    {
                      "v": "Rey"
                    }
                  ]
                }
              ],
              "totalBytesProcessed": "0",
              "jobComplete": true,
              "cacheHit": true
            });
          return scope;
        },
        response: { entries: [
            {
              email: "cwilloughwayay@ning.com",
              fname: "Cristobal"
            },
            {
              email: "rgozzettg1@huffingtonpost.com",
              fname: "Rey"
            }
          ] },
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              jobName: "Incoming Data",
              type: "webpayload"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "POST",
              responseTime: expect.whatever(),
              status: 200,
              url: "/projects/projectId/queries",
              vars: {}
            },
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              jobName: "Incoming Data",
              type: "webpayload"
            }
          ]
        ],
        metrics: [
          [
            "increment",
            "connector.request",
            1
          ],
          [
            "increment",
            "ship.service_api.call",
            1
          ],
          [
            "value",
            "connector.service_api.response_time",
            expect.whatever()
          ]
        ],
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
              "shipId": "9993743b22d60dd829001999"
            },
            {}
          ],
          [
            "GET",
            "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",
            {
              "shipId": "9993743b22d60dd829001999"
            },
            {}
          ]
        ],
        firehoseEvents: []
      };
    });
  });
});
