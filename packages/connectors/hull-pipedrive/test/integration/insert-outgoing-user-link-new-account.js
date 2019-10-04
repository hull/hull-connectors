/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";


it("Insert Single User To Pipedrive Link New Account", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("./fixtures/notifier-payloads/new-single-user-account");
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
          .post("/organizations")
          .reply(201, require("./fixtures/pipedrive/account_response"));
        scope
          .post("/persons")
          .reply(201, require("./fixtures/pipedrive/user_response"));

        return scope;
      },
      response: { flow_control: { type: "next", in: 5, in_time: 10, size: 10, } },
      logs: [
        [
          "info",
          "outgoing.job.start",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "user"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/organizations",
            "status": 201,
            "vars": {}
          }
        ],
        [
          "info",
          "outgoing.account.success",
          {
            "subject_type": "account",
            "request_id": expect.whatever(),
            "account_id": "account_id_2",
            "account_domain": "apple.com"
          },
          {
            "data": {
              "name": "Apple",
              "address": "1 Atlanta Dr"
            },
            "type": "Org",
            "operation": "post"
          }
        ],
        [
          "info",
          "incoming.account.success",
          {
            "subject_type": "account",
            "request_id": expect.whatever(),
            "account_domain": "apple.com",
            "account_anonymous_id": "pipedrive:3"
          },
          {
            "data": {
              "id": 3,
              "company_id": 6932609,
              "owner_id": {
                "id": 10358676,
                "name": "Louis Jahn",
                "email": "louis+pipedrive_sandbox@hull.io",
                "has_pic": false,
                "pic_hash": null,
                "active_flag": true,
                "value": 10358676
              },
              "name": "apple.com",
              "open_deals_count": 0,
              "related_open_deals_count": 0,
              "closed_deals_count": 0,
              "related_closed_deals_count": 0,
              "email_messages_count": 0,
              "people_count": 0,
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
              "category_id": null,
              "picture_id": null,
              "country_code": null,
              "first_char": "a",
              "update_time": "2019-09-17 13:10:25",
              "add_time": "2019-09-17 13:10:25",
              "visible_to": "3",
              "next_activity_date": null,
              "next_activity_time": null,
              "next_activity_id": null,
              "last_activity_id": null,
              "last_activity_date": null,
              "label": null,
              "address": "123 Random Pl",
              "address_subpremise": null,
              "address_street_number": null,
              "address_route": null,
              "address_sublocality": null,
              "address_locality": null,
              "address_admin_area_level_1": null,
              "address_admin_area_level_2": null,
              "address_country": null,
              "address_postal_code": null,
              "address_formatted_address": null,
              "cc_email": "hull-dev-sandbox-961195@pipedrivemail.com",
              "owner_name": "Louis Jahn",
              "edit_name": true
            },
            "type": "Org"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "GET",
            "url": "/persons/find",
            "status": 200,
            "vars": {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          {
            "request_id": expect.whatever()
          },
          {
            "responseTime": expect.whatever(),
            "method": "POST",
            "url": "/persons",
            "status": 201,
            "vars": {}
          }
        ],
        [
          "info",
          "outgoing.user.success",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_id": "5bd329d5e2bcf3eeaf000099",
            "user_email": "pipedrive_user_1@hull.com"
          },
          {
            "data": {
              "name": "pipedrive_user_1",
              "email": ["pipedrive_user_1@hull.com"],
              "address": "1234 Hull Pl"
            },
            "type": "Person",
            "operation": "post"
          }
        ],
        [
          "info",
          "incoming.user.success",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "pipedrive_user_1@hull.com",
            "user_anonymous_id": "pipedrive:827"
          },
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
        [
          "info",
          "outgoing.job.success",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "user"
          }
        ]
      ],
      firehoseEvents: [
        ["traits", { "asAccount": { "domain": "apple.com", "anonymous_id": "pipedrive:3" }, "subjectType": "account" },
          { "pipedrive/id": { "value": 3, "operation": "set" } }],
        ["traits", { "asUser": { "email": "pipedrive_user_1@hull.com", "anonymous_id": "pipedrive:827" }, "subjectType": "user" },
          { "pipedrive/id": { "value": 827, "operation": "set" },
          "pipedrive/description": { "value": "New Contact", "operation": "set" } }]
      ],
      metrics:   [
        ["increment", "connector.request", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["value", "connector.service_api.response_time", expect.whatever(),],
      ],
      platformApiCalls: []
    });
  });
});

