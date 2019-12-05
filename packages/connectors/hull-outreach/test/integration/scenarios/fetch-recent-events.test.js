// @flow
const _ = require("lodash");


process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorConfig = require("../../../server/config").default;

test("fetch recent events from outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-events",
      connector: {
        private_settings: {
          access_token: "1234",
          events_to_fetch: [
            "prospect_stage_changed",
            "message_opened",
            "outbound_message"
          ],
          events_last_fetch_at: "2019-12-04T13:44:47Z"
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope.get("/api/v2/webhooks/")
          .reply(200, {data: []});
        scope
          .post("/api/v2/webhooks/")
          .reply(201, require("../fixtures/api-responses/create-webhook.json"));
        scope
          .get(/\/api\/v2\/events\/\?filter\[eventAt\]=2019-12-04T13:44:47Z\.\..+Z&sort=-eventAt&page\[limit\]=1000/)
          .reply(200, require("../fixtures/api-responses/list-recent-events"));
        return scope;
      },
      response: { status : "deferred"},
      logs: [
        [
          "info",
          "incoming.job.start",
          {},
          {
            "jobName": "Incoming Data",
            "type": "webpayload"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {},
          {
            "method": "GET",
            "responseTime": expect.whatever(),
            "status": 200,
            "url": "/webhooks/",
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {},
          {
            "method": "POST",
            "responseTime": expect.whatever(),
            "status": 201,
            "url": "/webhooks/",
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {},
          {
            "method": "GET",
            "responseTime": expect.whatever(),
            "status": 200,
            "url": "/events/",
            "vars": {}
          }
        ],
        [
          "debug",
          "incoming.user.success",
          {
            "subject_type": "user",
            "user_anonymous_id": "outreach:3"
          },
          {
            "data": {
              "attributes": {
                "body": null,
                "createdAt": "2019-12-04T13:58:13.000Z",
                "eventAt": "2019-12-04T13:58:13.000Z",
                "externalUrl": null,
                "mailingId": null,
                "name": "message_opened",
                "payload": null,
                "requestCity": null,
                "requestDevice": null,
                "requestHost": null,
                "requestProxied": false,
                "requestRegion": null
              },
              "id": 186229,
              "links": {
                "self": "https://api.outreach.io/api/v2/events/186229"
              },
              "relationships": {
                "mailing": {
                  "data": null
                },
                "prospect": {
                  "data": {
                    "id": 3,
                    "type": "prospect"
                  }
                },
                "user": {
                  "data": {
                    "id": 1,
                    "type": "user"
                  }
                }
              },
              "type": "event"
            },
            "type": "Event"
          }
        ],
        [
          "info",
          "incoming.job.success",
          {},
          {
            "jobName": "Incoming Data",
            "type": "webpayload"
          }
        ]
      ],
      firehoseEvents: [
        [
          "track",
          {
            "asUser": {
              "anonymous_id": "outreach:3"
            },
            "subjectType": "user"
          },
          {
            "created_at": "2019-12-04T13:58:13.000Z",
            "event": "Message Opened",
            "event_id": 186229,
            "ip": null,
            "properties": {
              "body": null,
              "created_at": "2019-12-04T13:58:13.000Z",
              "email_id": null,
              "external_url": null,
              "ip": null,
              "payload": null,
              "request_city": null,
              "request_proxied": false,
              "request_region": null,
              "user_agent": null
            },
            "referer": null,
            "url": null
          }
        ],
        [
          "traits",
          {
            "asUser": {
              "anonymous_id": "outreach:3"
            },
            "subjectType": "user"
          },
          {
            "outreach/id": {
              "operation": "set",
              "value": 3
            }
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
          "PUT",
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings": {
              "access_token": "1234",
              "events_last_fetch_at": "2019-12-04T13:44:47Z",
              "events_to_fetch": [
                "prospect_stage_changed",
                "message_opened",
                "outbound_message"
              ],
              "webhook_id": 3
            },
            "refresh_status": false
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
          "/api/v1/9993743b22d60dd829001999",
          {},
          {
            "private_settings": {
              "access_token": "1234",
              "events_last_fetch_at": expect.whatever(),
              "events_to_fetch": [
                "prospect_stage_changed",
                "message_opened",
                "outbound_message"
              ]
            },
            "refresh_status": false
          }
        ]
      ]
    };
  });
});
