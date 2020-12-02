// @flow
import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

const private_settings = {
  "import_type": "users",
  "attributes_group_name": "grouped_attributes",
  "import_interval": "180",
  "token_expires_in": 3599,
  "token_fetched_at": "2020-08-25T10:00:45Z",
  "access_token": "acccessToken",
  "refresh_token": "refreshToken",
  "query": "SELECT email, first_name as `fname` FROM `286213.my_dataset_example.my_users` LIMIT 1",
  "project_id": "projectId",
  "job_id": "hull_import_1",
  "user_claims": [
    { "hull": "email", "service": "email" },
    { "hull": "external_id", "service": "external_id" }
  ]
}

describe("BigQuery Import Results Test", () => {

  it("should import results from BigQuery", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "check-job",
        connector: {
          private_settings
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://bigquery.googleapis.com/bigquery/v2");

          scope
            .get("/projects/projectId/jobs/hull_import_1")
            .reply(200, {
              "kind": "bigquery#job",
              "etag": "l+AU4GPnjNsPUdX6MCvnsQ==",
              "id": "19",
              "selfLink": "https://bigquery.googleapis.com/bigquery/v2/projects/projectId/jobs/hull_import_19?location=US",
              "user_email": "louis@hull.io",
              "configuration": {
                "query": {
                  "query": "SELECT email, first_name as `fname` FROM `propane-ripsaw-286213.my_dataset_example.my_users` LIMIT 2",
                  "destinationTable": {
                    "projectId": "1",
                    "datasetId": "1",
                    "tableId": "1"
                  },
                  "writeDisposition": "WRITE_TRUNCATE",
                  "priority": "INTERACTIVE",
                  "useLegacySql": false
                },
                "jobType": "QUERY"
              },
              "jobReference": {
                "projectId": "1",
                "jobId": "1",
                "location": "US"
              },
              "statistics": {
                "creationTime": "1598289330136",
                "startTime": "1598289330403",
                "endTime": "1598289330457",
                "totalBytesProcessed": "0",
                "query": {
                  "totalBytesProcessed": "0",
                  "totalBytesBilled": "0",
                  "cacheHit": true,
                  "statementType": "SELECT"
                }
              },
              "status": {
                "state": "DONE"
              }
            });

         scope
            .get("/projects/projectId/queries/hull_import_1?maxResults=1000&pageToken=")
            .reply(200, {
              "kind": "bigquery#getQueryResultsResponse",
              "etag": "1==",
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
                "jobId": "1",
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
        response: { status : "deferred"},
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
              method: "GET",
              responseTime: expect.whatever(),
              status: 200,
              url: "/projects/projectId/jobs/hull_import_1",
              vars: {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "GET",
              responseTime: expect.whatever(),
              status: 200,
              url: "/projects/projectId/queries/hull_import_1?maxResults=1000&pageToken=",
              vars: {}
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              subject_type: "user",
              user_email: "cwilloughwayay@ning.com"
            },
            {
              data: {
                "email": "cwilloughwayay@ning.com",
                "fname": "Cristobal"
              },
              type: "User"
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              subject_type: "user",
              user_email: "rgozzettg1@huffingtonpost.com"
            },
            {
              data: {
                "email": "rgozzettg1@huffingtonpost.com",
                "fname": "Rey"
              },
              type: "User"
            }
          ],
          [
            "info",
            "\"incoming.job.finished\"",
            {},
            undefined
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
          ],
        ],
        firehoseEvents: [
          [
            "traits",
            {
              asUser: {
                email: "cwilloughwayay@ning.com"
              },
              subjectType: "user"
            },
            {
              "grouped_attributes/fname": "Cristobal"
            }
          ],
          [
            "traits",
            {
              asUser: {
                email: "rgozzettg1@huffingtonpost.com"
              },
              subjectType: "user"
            },
            {
              "grouped_attributes/fname": "Rey"
            }
          ],
        ],
        platformApiCalls: [
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            expect.whatever(),
            {},
            {
              private_settings: {
                ...private_settings,
                last_sync_at: "1598289330136"
              },
              refresh_status: false
            }
          ],
          [
            "GET",
            "/api/v1/app",
            {},
            {}
          ],
          [
            "PUT",
            expect.whatever(),
            {},
            {
              private_settings: {
                ...private_settings,
                job_id: null
              },
              refresh_status: false
            }
          ],
        ]
      };
    });
  });
});
