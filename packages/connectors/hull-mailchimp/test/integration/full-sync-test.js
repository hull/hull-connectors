// @flow
import connectorConfig from "../../server/config";

const path = require("path");
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.MAILCHIMP_CLIENT_ID = "1234";
process.env.MAILCHIMP_CLIENT_SECRET = "1234";
process.env.COMBINED = "true";

const connector = {
  id: "123456789012345678901234",
  private_settings: {
    api_key: "1",
    domain: "mock",
    mailchimp_list_id: "1",
    interest_category_id: "2",
    interests_mapping: {
      hullSegmentId: "MailchimpInterestId"
    },
    segment_mapping: {
      hullSegmentId: "MailchimpSegmentId"
    },
    synchronized_user_segments: ["hullSegmentId"]
  }
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it("Performing sync", () => {
  /*const email = "";
  return testScenario(
    {
      connectorConfig: () => ({
        ...connectorConfig(),
        queueConfig: undefined
      })
    },
    ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "sync",
        externalApiMock: () => {
          const scope = nock("https://mock.api.mailchimp.com/3.0");
          scope
            .post("/batches", {
              operations: [
                {
                  method: "GET",
                  path: "/lists/1/members",
                  params: { exclude_fields: "_links,members._links" }
                }
              ]
            })
            .reply(200, require("./fixtures/get-batches.json"));

          scope
            .get("/batches/8b2428d747")
            .reply(200, require("./fixtures/get-batch.json"));
          scope
            .get(
              "/mailchimp-api-batch.s3.amazonaws.com/8b2428d747-response.tar.gz"
            )
            .query(true)
            .replyWithFile(
              200,
              path.join(__dirname, "fixtures", "batch-response.tar.gz"),
              { "Content-Type": "application/json" }
            );
          scope.delete("/batches/8b2428d747").reply(200);
          return scope;
        },
        connector,
        usersSegments,
        accountsSegments: [],
        response: { response: "ok" },
        logs: [
          ["debug", "dispatch", {}, { id: 0, name: "fetchAllUsers" }],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "POST",
              responseTime: expect.any(Number),
              status: 200,
              url: "/batches",
              vars: { listId: "1" }
            }
          ],
          [
            "info",
            "incoming.job.start",
            {},
            { id: "8b2428d747", jobName: "mailchimp-batch-job", type: "user" }
          ],
          ["debug", "dispatch", {}, { id: 0, name: "handleMailchimpBatch" }],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "GET",
              responseTime: expect.whatever(),
              status: 200,
              url: "/batches/{{batchId}}",
              vars: { batchId: "8b2428d747", listId: "1" }
            }
          ],
          [
            "info",
            "incoming.job.progress",
            {},
            {
              jobName: "mailchimp-batch-job",
              progress: {
                completed_at: "2016-05-12T17:43:42+00:00",
                errored_operations: 0,
                finished_operations: 4,
                id: "8b2428d747",
                response_body_url:
                  "https://mock.api.mailchimp.com/3.0/mailchimp-api-batch.s3.amazonaws.com/8b2428d747-response.tar.gz?AWSAccessKeyId=AKIAJWOH5BECJQZIEWNQ&Expires=1463075697&Signature=9Mva8uTbY56CIu3nywGcOgM%2FH%2FI%3D",
                status: "finished",
                submitted_at: "2016-05-12T17:43:32+00:00",
                total_operations: 4
              }
            }
          ],
          ["debug", "JOB", {}, { job: "importUsers", length: 3 }],
          ["debug", "dispatch", {}, { id: 0, name: "importUsers" }],
          ["debug", "incoming.users.start", {}, 3],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              method: "DELETE",
              responseTime: expect.whatever(),
              status: 200,
              url: "/batches/{{batchId}}",
              vars: { batchId: "8b2428d747", listId: "1" }
            }
          ],
          [
            "debug", "incoming.user.success",
            {
              subject_type: "user",
              user_anonymous_id: "mailchimp:882e9bec19",
              user_email: "urist.mcvankab+1@freddiesjokes.co"
            },
            {
              traits: {
                "mailchimp/avg_click_rate": 0,
                "mailchimp/avg_open_rate": 1,
                "mailchimp/country_code": "US",
                "mailchimp/email": "urist.mcvankab+1@freddiesjokes.co",
                "mailchimp/email_client": "",
                "mailchimp/fname": "",
                "mailchimp/language": "en",
                "mailchimp/last_changed": "2015-09-15 17:27:16",
                "mailchimp/latitude": 32.5805,
                "mailchimp/lname": "",
                "mailchimp/longitude": -97.1389,
                "mailchimp/member_rating": 2,
                "mailchimp/status": "subscribed",
                "mailchimp/subscribed": true,
                "mailchimp/timezone": "America/Chicago",
                "mailchimp/unique_email_id": "882e9bec19",
                "mailchimp/vip": false
              }
            }
          ],
          [
            "debug", "incoming.user.success",
            {
              subject_type: "user",
              user_anonymous_id: "mailchimp:083ae0451e",
              user_email: "urist.mcvankab+2@freddiesjokes.com"
            },
            {
              traits: {
                "mailchimp/avg_click_rate": 0,
                "mailchimp/avg_open_rate": 1,
                "mailchimp/country_code": "",
                "mailchimp/email": "urist.mcvankab+2@freddiesjokes.com",
                "mailchimp/email_client": "",
                "mailchimp/fname": "",
                "mailchimp/language": "",
                "mailchimp/last_changed": "2015-09-15 15:37:03",
                "mailchimp/latitude": 0,
                "mailchimp/lname": "",
                "mailchimp/longitude": 0,
                "mailchimp/member_rating": 3,
                "mailchimp/status": "subscribed",
                "mailchimp/subscribed": true,
                "mailchimp/timezone": "",
                "mailchimp/unique_email_id": "083ae0451e",
                "mailchimp/vip": false
              }
            }
          ],
          [
            "debug", "incoming.user.success",
            {
              subject_type: "user",
              user_anonymous_id: "mailchimp:6ad2993d47",
              user_email: "urist.mcvankab@freddiesjokes.com"
            },
            {
              traits: {
                first_name: { operation: "setIfNull", value: "Urist" },
                last_name: { operation: "setIfNull", value: "McVankab" },
                "mailchimp/avg_click_rate": 0,
                "mailchimp/avg_open_rate": 0,
                "mailchimp/country_code": "",
                "mailchimp/email": "urist.mcvankab@freddiesjokes.com",
                "mailchimp/email_client": "",
                "mailchimp/fname": "Urist",
                "mailchimp/language": "",
                "mailchimp/last_changed": "2015-09-15 14:40:01",
                "mailchimp/latitude": 0,
                "mailchimp/lname": "McVankab",
                "mailchimp/longitude": 0,
                "mailchimp/member_rating": 2,
                "mailchimp/status": "subscribed",
                "mailchimp/subscribed": true,
                "mailchimp/timezone": "",
                "mailchimp/unique_email_id": "6ad2993d47",
                "mailchimp/vip": true
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              jobName: "mailchimp-batch-job"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              asUser: {
                anonymous_id: "mailchimp:882e9bec19",
                email: "urist.mcvankab+1@freddiesjokes.co"
              },
              subjectType: "user"
            },
            {
              "mailchimp/avg_click_rate": 0,
              "mailchimp/avg_open_rate": 1,
              "mailchimp/country_code": "US",
              "mailchimp/email": "urist.mcvankab+1@freddiesjokes.co",
              "mailchimp/email_client": "",
              "mailchimp/fname": "",
              "mailchimp/language": "en",
              "mailchimp/last_changed": "2015-09-15 17:27:16",
              "mailchimp/latitude": 32.5805,
              "mailchimp/lname": "",
              "mailchimp/longitude": -97.1389,
              "mailchimp/member_rating": 2,
              "mailchimp/status": "subscribed",
              "mailchimp/subscribed": true,
              "mailchimp/timezone": "America/Chicago",
              "mailchimp/unique_email_id": "882e9bec19",
              "mailchimp/vip": false
            }
          ],
          [
            "traits",
            {
              asUser: {
                anonymous_id: "mailchimp:083ae0451e",
                email: "urist.mcvankab+2@freddiesjokes.com"
              },
              subjectType: "user"
            },
            {
              "mailchimp/avg_click_rate": 0,
              "mailchimp/avg_open_rate": 1,
              "mailchimp/country_code": "",
              "mailchimp/email": "urist.mcvankab+2@freddiesjokes.com",
              "mailchimp/email_client": "",
              "mailchimp/fname": "",
              "mailchimp/language": "",
              "mailchimp/last_changed": "2015-09-15 15:37:03",
              "mailchimp/latitude": 0,
              "mailchimp/lname": "",
              "mailchimp/longitude": 0,
              "mailchimp/member_rating": 3,
              "mailchimp/status": "subscribed",
              "mailchimp/subscribed": true,
              "mailchimp/timezone": "",
              "mailchimp/unique_email_id": "083ae0451e",
              "mailchimp/vip": false
            }
          ],
          [
            "traits",
            {
              asUser: {
                anonymous_id: "mailchimp:6ad2993d47",
                email: "urist.mcvankab@freddiesjokes.com"
              },
              subjectType: "user"
            },
            {
              first_name: { operation: "setIfNull", value: "Urist" },
              last_name: { operation: "setIfNull", value: "McVankab" },
              "mailchimp/avg_click_rate": 0,
              "mailchimp/avg_open_rate": 0,
              "mailchimp/country_code": "",
              "mailchimp/email": "urist.mcvankab@freddiesjokes.com",
              "mailchimp/email_client": "",
              "mailchimp/fname": "Urist",
              "mailchimp/language": "",
              "mailchimp/last_changed": "2015-09-15 14:40:01",
              "mailchimp/latitude": 0,
              "mailchimp/lname": "McVankab",
              "mailchimp/longitude": 0,
              "mailchimp/member_rating": 2,
              "mailchimp/status": "subscribed",
              "mailchimp/subscribed": true,
              "mailchimp/timezone": "",
              "mailchimp/unique_email_id": "6ad2993d47",
              "mailchimp/vip": true
            }
          ]
        ],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.job.fetchAllUsers.start", 1],
          ["increment", "batch_job.count", 1],
          ["value", "ship.job.fetchAllUsers.duration", expect.any(Number)],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.any(Number)],
          ["increment", "ship.job.handleMailchimpBatch.start", 1],
          ["value", "ship.job.handleMailchimpBatch.duration", expect.any(Number)],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.any(Number)],
          ["increment", "batch_job.attempts", 1],
          ["value", "batch_job.completion_time", 10],
          ["increment", "ship.job.importUsers.start", 1],
          ["increment", "ship.incoming.users", 1],
          ["increment", "ship.incoming.users", 1],
          ["increment", "ship.incoming.users", 1],
          ["value", "ship.job.importUsers.duration", expect.any(Number)],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.any(Number)]
        ],
        platformApiCalls: [
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/123456789012345678901234",
            {},
            {
              private_settings: {
                api_key: "1",
                domain: "mock",
                interest_category_id: "2",
                interests_mapping: {
                  hullSegmentId: "MailchimpInterestId",
                },
                mailchimp_list_id: "1",
                segment_mapping: { hullSegmentId: "MailchimpSegmentId" },
                synchronized_user_segments: ["hullSegmentId"],
                sync_batch_id: "8b2428d747"
              },
              refresh_status: false
            }
          ],
          ["GET", "/api/v1/app", {}, {}],
          [
            "PUT",
            "/api/v1/123456789012345678901234",
            {},
            {
              private_settings: {
                api_key: "1",
                domain: "mock",
                interest_category_id: "2",
                interests_mapping: {
                  hullSegmentId: "MailchimpInterestId"
                },
                mailchimp_list_id: "1",
                segment_mapping: {
                  hullSegmentId: "MailchimpSegmentId",
                },
                synchronized_user_segments: ["hullSegmentId"],
                sync_batch_id: null,
              },
              refresh_status: false
            }
          ]
        ]
      };
    }
  );*/
});
