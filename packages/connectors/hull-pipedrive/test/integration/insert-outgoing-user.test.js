/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";
import manifest from "../../manifest.json";



describe("Insert User Tests", () => {

  it("Insert Single User Fails", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = {
        "notification_id": "38108659-4d7b-46cc-861b-3da772d1fec2",
        "configuration": {
          "id": "123456789012345678901234",
          "organization": "c5011027.hullbeta.io",
          "secret": "shhhh"
        },
        "connector": {
          "private_settings": {
            "webhook_id_person": 11111,
            "webhook_id_org": 11111,
            "user_claims": [{ "hull": "email", "service": "email" }],
            "outgoing_user_attributes": [{ "hull": "address", "service": "address" }],
            "access_token": "1234",
            "refresh_token": "abcd",
            "synchronized_user_segments": ["1"]
          },
          "id": "123456789012345678901234"
        },
        "channel": "user:update",
        "messages": [
          {
            "changes": { "user": { "address": [] } },
            "user": {
              "id": "5bd329d5e2bcf3eeaf000092",
              "email": "pipedrive_user_1@hull.com"
            },
            "account_segments": [],
            "segments": [{"id": "1"}],
            "message_id": "message_1"
          }
        ]
      };
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://api-proxy.pipedrive.com");

          scope
            .get("/persons/find?term=pipedrive_user_1@hull.com&search_by_email=1")
            .reply(200, require("./fixtures/pipedrive/person_lookup_no_result"));

          scope
            .post("/persons")
            .reply(400, require("./fixtures/pipedrive/user_response_missing_name"));

          return scope;
        },
        response: { flow_control: { type: "next" } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            { "responseTime": expect.whatever(), "method": "GET", "url": "/persons/find", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            { "responseTime": expect.whatever(), "method": "POST", "url": "/persons", "status": 400, "vars": {} }],
          [
            "error",
            "outgoing.user.error",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5bd329d5e2bcf3eeaf000092",
              "user_email": "pipedrive_user_1@hull.com"
            },
            {
              "data": {
                "email": [
                  "pipedrive_user_1@hull.com"
                ]
              },
              "type": "Person",
              "error": "Name must be given."
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "ship.service_api.call", 1],
          ["value", "connector.service_api.response_time", expect.whatever()],
          ["increment", "connector.service_api.error", 1],
          ["increment", "service.service_api.errors", 1]
        ],
        platformApiCalls: []
      });
    });
  });

  it("Insert Single User To Pipedrive", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      const updateMessages = {
        "notification_id": "38108659-4d7b-46cc-861b-3da772d1fec2",
        "configuration": {
          "id": "123456789012345678901234",
          "organization": "c5011027.hullbeta.io",
          "secret": "shhhh"
        },
        "connector": {
          "description": "some",
          "tags": [],
          "source_url": "https://dev-hull-pipedrive.ngrok.io/",
          "private_settings": {
            "webhook_id_person": 11111,
            "webhook_id_org": 11111,
            "user_claims": [
              {
                "hull": "email",
                "service": "email"
              }
            ],
            "token_expires_in": 7200,
            "outgoing_user_attributes": [
              {
                "hull": "address",
                "service": "address"
              },
              {
                "hull": "description",
                "service": "4f9ab746d362cdbce1344c14eec9eb2b26ef484b"
              }
            ],
            "incoming_user_attributes": [
              {
                "hull": "pipedrive/description",
                "service": "4f9ab746d362cdbce1344c14eec9eb2b26ef484b"
              }
            ],
            "token_created_at": 1544104207,
            "access_token": "1234",
            "refresh_token": "abcd",
            "account_claims": [],
            "outgoing_account_attributes": [],
            "synchronized_user_segments": [
              "1"
            ],
            "synchronized_account_segments": [],
            "incoming_account_attributes": [],
            "created_at": 1544269649
          },
          "index": "https://dev-hull-outreach.ngrok.io/",
          "name": "pipedrive",
          "extra": {},
          "settings": {},
          "type": "ship",
          "secret": "shhh",
          "updated_at": "2018-12-09T11:20:32Z",
          "status": {},
          "id": "123456789012345678901234",
          "picture": "",
          "homepage_url": "",
          "manifest_url": "",
          "created_at": "2018-12-06T13:49:58Z"
        },
        "channel": "user:update",
        "messages": [
          {
            "changes": {
              "is_new": false,
              "account": {},
              "user": {
                "address": [
                  "123 Pl",
                  "1234 Hull Pl"
                ]
              },
              "account_segments": {}
            },
            "account": {},
            "user": {
              "id": "5bd329d5e2bcf3eeaf000092",
              "name": "pipedrive_user_1",
              "email": "pipedrive_user_1@hull.com",
              "address": "1234 Hull Pl"
            },
            "account_segments": [],
            "segments": [
              {
                "id": "1",
                "name": "UserSegment1",
                "updated_at": "2018-12-09T12:05:12Z",
                "type": "users_segment",
                "created_at": "2018-10-29T14:58:34Z"
              }
            ],
            "message_id": "message_1"
          }
        ],
        "accounts_segments": [],
        "segments": [
          {
            "id": "1",
            "updated_at": "2018-12-09T12:05:12Z",
            "created_at": "2018-10-29T14:58:34Z",
            "name": "UserSegment1",
            "type": "users_segment",
            "stats": {

            }
          }
        ]
      };
      return _.assign(updateMessages, {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://api-proxy.pipedrive.com");

          scope
            .get("/persons/find?term=pipedrive_user_1@hull.com&search_by_email=1")
            .reply(200, require("./fixtures/pipedrive/person_lookup_no_result"));

          scope
            .post("/persons")
            .reply(201, require("./fixtures/pipedrive/user_response"));

          return scope;
        },
        response: { flow_control: { type: "next" } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            { "responseTime": expect.whatever(), "method": "GET", "url": "/persons/find", "status": 200, "vars": {} }],
          ["debug", "connector.service_api.call", { "request_id": expect.whatever() },
            { "responseTime": expect.whatever(), "method": "POST", "url": "/persons", "status": 201, "vars": {} }],
          ["info", "outgoing.user.success", { "subject_type": "user", "request_id": expect.whatever(), "user_id": "5bd329d5e2bcf3eeaf000092", "user_email": "pipedrive_user_1@hull.com" },
            {
              "data": {
                "address": "1234 Hull Pl",
                "email": ["pipedrive_user_1@hull.com"],
                "name": "pipedrive_user_1"
              },
              "type": "Person"
            }
          ],
          ["debug", "incoming.user.success", { "subject_type": "user", "request_id": expect.whatever(), "user_email": "pipedrive_user_1@hull.com", "user_anonymous_id": "pipedrive:827"},
            {
              "data": {
                "id": 827,
                "company_id": 7009148,
                "owner_id": {
                  "id": 10475878,
                  "name": "Andy",
                  "email": "andy@hull.com",
                  "has_pic": false,
                  "pic_hash": null,
                  "active_flag": true,
                  "value": 10475878
                },
                "org_id": null,
                "name": "pipedrive_user_1",
                "first_name": "pipedrive_user_1",
                "last_name": null,
                "open_deals_count": 0,
                "related_open_deals_count": 0,
                "closed_deals_count": 0,
                "related_closed_deals_count": 0,
                "participant_open_deals_count": 0,
                "participant_closed_deals_count": 0,
                "email_messages_count": 0,
                "activities_count": 0,
                "done_activities_count": 0,
                "undone_activities_count": 0,
                "reference_activities_count": 0,
                "files_count": 0,
                "notes_count": 0,
                "followers_count": 0,
                "won_deals_count": 0,
                "related_won_deals_count": 0,
                "lost_deals_count": 0,
                "related_lost_deals_count": 0,
                "active_flag": true,
                "phone": [
                  {
                    "value": "",
                    "primary": true
                  }
                ],
                "email": [
                  {
                    "label": "",
                    "value": "pipedrive_user_1@hull.com",
                    "primary": true
                  }
                ],
                "first_char": "p",
                "4f9ab746d362cdbce1344c14eec9eb2b26ef484b": "New Contact",
                "update_time": "2019-10-01 16:04:44",
                "add_time": "2019-10-01 16:04:44",
                "visible_to": "3",
                "picture_id": null,
                "next_activity_date": null,
                "next_activity_time": null,
                "next_activity_id": null,
                "last_activity_id": null,
                "last_activity_date": null,
                "last_incoming_mail_time": null,
                "last_outgoing_mail_time": null,
                "label": null,
                "org_name": null,
                "cc_email": "ad@pipedrivemail.com",
                "owner_name": "Andy"
              },
              "type": "Person"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "user" }]
        ],
        firehoseEvents: [
          [
            "traits",
            { "asUser":
                {
                  "email": "pipedrive_user_1@hull.com",
                  "anonymous_id": "pipedrive:827"
                },
              "subjectType": "user"
            },
            {
              "pipedrive/id": { "value": 827, "operation": "set" },
              "pipedrive/description": { "value": "New Contact", "operation": "set" }
            }
          ]
        ],
        metrics:   [
          ["increment", "connector.request", 1,],
          ["increment", "ship.service_api.call", 1,],
          ["increment", "ship.service_api.call", 1,],
          ["value", "connector.service_api.response_time", expect.whatever(),],
          ["value", "connector.service_api.response_time", expect.whatever(),],
        ],
        platformApiCalls: []
      });
    });
  });

});
