/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../server/config";


it("Batch - Insert Single Account To Pipedrive", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("./fixtures/notifier-payloads/new-single-account");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      is_export: true,
      connector: {
        "description": "some",
        "tags": [],
        "source_url": "https://dev-hull-pipedrive.ngrok.io/",
        "private_settings": {
          "webhook_id_person": 11111,
          "webhook_id_org": 11111,
          "token_expires_in": 7200,
          "outgoing_user_attributes": [],
          "incoming_user_attributes": [],
          "token_created_at": 1544104207,
          "access_token": "1234",
          "refresh_token": "abcd",
          "account_claims": [
            {
              "hull": "domain",
              "service": "name"
            }
          ],
          "outgoing_account_attributes": [
            {
              "hull": "address",
              "service": "address"
            },
            {
              "hull": "pipedrive/department",
              "service": "department"
            }
          ],
          "synchronized_user_segments": [],
          "synchronized_account_segments": [
            "random_segment"
          ],
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
      externalApiMock: () => {
        const scope = nock("https://api-proxy.pipedrive.com");

        scope
          .post("/organizations")
          .reply(201, require("./fixtures/pipedrive/account_response"));

        return scope;
      },
      response: { flow_control: { type: "next" } },
      logs: [
        [
          "info",
          "outgoing.job.start",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "account"
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
              "name": "apple.com",
              "address": "123 Random Pl"
            },
            "type": "Org"
          }
        ],
        [
          "debug", "incoming.account.success",
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
          "info",
          "outgoing.job.success",
          {
            "request_id": expect.whatever()
          },
          {
            "jobName": "Outgoing Data",
            "type": "account"
          }
        ]
      ],
      firehoseEvents: [
        ["traits",
          { "asAccount": { "anonymous_id": "pipedrive:3", "domain": "apple.com", }, "subjectType": "account" },
          { "pipedrive/id": { "value": 3, "operation": "set" } }]
      ],
      metrics:   [
        ["increment", "connector.request", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
      ],
      platformApiCalls: []
    });
  });
});

