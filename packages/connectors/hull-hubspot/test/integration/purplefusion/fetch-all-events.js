/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


it("Complex fetch all email events - multiple event to fetch and filter", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-all-email-events",
      connector: {
        private_settings: {
          fetch_email_events: true,
          events_to_fetch: [
            'Email Sent',
            'Email Link Clicked',
            'Email Processed'
          ],
          email_events_user_claims: [
            {
              hull: 'email',
              service: 'recipient'
            }
          ],
          portal_id: 6015139,
          refresh_token: 'refresh_token',
          token: 'access_token',
          events_last_fetch_started_at: '2019-08-29T12:36:50.396Z'
        }
      },
      usersSegments: [],
      accountsSegments: [],
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/email/public/v1/events?limit=300")
          .reply(200, require("./fixtures/events/hubspot-email-events"));
        scope.get("/email/public/v1/campaigns/1")
          .reply(200, { "contentId": 123 });
        scope.get("/email/public/v1/campaigns/2")
          .reply(200, { "contentId": 456 });
        scope.get("/marketing-emails/v1/emails?id=123")
          .reply(200, {
              "objects": [
                {
                  "id": 123,
                  "primaryRichTextModuleHtml": "Email Body",
                  "subject": "Marketing Email 1"
                }
              ],
              "total": 1
            }
          );
        scope.get("/marketing-emails/v1/emails?id=456")
          .reply(200, {
              "objects": [
                {
                  "id": 456,
                  "primaryRichTextModuleHtml": "Email Body",
                  "subject": "Marketing Email 2"
                }
              ],
              "total": 1,
            }
          );
        return scope;
      },
      response: { status : "ok"},
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/email/public/v1/events", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/email/public/v1/campaigns/1", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/marketing-emails/v1/emails", "status": 200, "vars": {} }],
        ["info", "incoming.user.success", { "subject_type": "user", "user_email": "email@gmail.com" },
          {
            "data": {
              "appName": "Batch",
              "created": 1567084185625,
              "browser": {},
              "referer": "",
              "deviceType": "MOBILE",
              "linkId": 0,
              "appId": 113,
              "url": "http://nytimes.com/?utm_campaign=Newsletter&utm_source=hs_email&utm_medium=email&utm_content=76224413&_hsmi=76224413",
              "userAgent": "Mozilla/5.0 (Android 9; Mobile; rv:68.0) Gecko/68.0 Firefox/68.0",
              "location": {},
              "id": "event_id_1",
              "smtpId": null,
              "portalId": 6015139,
              "recipient": "email@gmail.com",
              "sentBy": {
                "id": "sentById",
                "created": 1567081617162
              },
              "type": "CLICK",
              "filteredEvent": false,
              "emailCampaignId": 1
            },
            "type": "hubspot_incoming_email_event"
          }
        ],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/email/public/v1/campaigns/2", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/marketing-emails/v1/emails", "status": 200, "vars": {} }],
        ["info", "incoming.user.success", { "subject_type": "user", "user_email": "email@gmail.com" },
          {
            "data": {
              "appName": "Batch",
              "browser": {},
              "deviceType": "COMPUTER",
              "created": 1566584323020,
              "duration": 0,
              "userAgent": "Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)",
              "location": {},
              "id": "event_id_2",
              "recipient": "email@gmail.com",
              "sentBy": {
                "id": "sentById",
                "created": 1566582186465
              },
              "smtpId": null,
              "portalId": 6015139,
              "type": "PROCESSED",
              "filteredEvent": false,
              "appId": 113,
              "emailCampaignId": 2
            },
            "type": "hubspot_incoming_email_event"
          }
        ],
        ["info", "incoming.user.success", { "subject_type": "user", "user_email": "email@gmail.com" },
          {
            "data": {
              "appName": "Batch",
              "created": 1567081617162,
              "portalId": 6015139,
              "emailCampaignId": 1,
              "recipient": "email@gmail.com",
              "appId": 113,
              "id": "event_id_4",
              "replyTo": [
                "email2@gmail.com"
              ],
              "cc": [],
              "bcc": [],
              "subject": "826",
              "from": "email2@gmail.com",
              "smtpId": null,
              "sentBy": {
                "id": "sentById",
                "created": 1567081617162
              },
              "type": "SENT"
            },
            "type": "hubspot_incoming_email_event"
          }
        ],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["track", { "asUser": { "email": "email@gmail.com" }, "subjectType": "user" },
          {
            "ip": null,
            "url": null,
            "referer": null,
            "event_id": "hubspot:6015139:event_id_1",
            "created_at": "2019-08-29T13:09:45.625Z",
            "type": "email",
            "source": "hubspot",
            "properties": {
              "email_campaign_id": 1,
              "email_subject": "Marketing Email 1",
              "link_url": "http://nytimes.com/?utm_campaign=Newsletter&utm_source=hs_email&utm_medium=email&utm_content=76224413&_hsmi=76224413",
              "portal_id": 6015139,
              "email_id": "event_id_1",
              "sent_by": "sentById",
              "recipient": "email@gmail.com",
              "last_imported_at": expect.whatever(),
              "status": "Completed",
              "created_at": "2019-08-29T13:09:45.625Z",
              "email_body": "[html-body]\nEmail Body"
            },
            "event": "Email Link Clicked"
          }
        ],
        ["track", { "asUser": { "email": "email@gmail.com" }, "subjectType": "user" },
          {
            "ip": null,
            "url": null,
            "referer": null,
            "event_id": "hubspot:6015139:event_id_2",
            "created_at": "2019-08-23T18:18:43.020Z",
            "type": "email",
            "source": "hubspot",
            "properties": {
              "email_campaign_id": 2,
              "email_subject": "Marketing Email 2",
              "portal_id": 6015139,
              "email_id": "event_id_2",
              "sent_by": "sentById",
              "recipient": "email@gmail.com",
              "last_imported_at": expect.whatever(),
              "status": "Completed",
              "created_at": "2019-08-23T18:18:43.020Z",
              "email_body": "[html-body]\nEmail Body"
            },
            "event": "Email Processed"
          }
        ],
        ["track", { "asUser": { "email": "email@gmail.com" }, "subjectType": "user" },
          {
            "ip": null,
            "url": null,
            "referer": null,
            "event_id": "hubspot:6015139:event_id_4",
            "created_at": "2019-08-29T12:26:57.162Z",
            "type": "email",
            "source": "hubspot",
            "properties": {
              "email_campaign_id": 1,
              "email_subject": "Marketing Email 1",
              "portal_id": 6015139,
              "email_id": "event_id_4",
              "sent_by": "sentById",
              "recipient": "email@gmail.com",
              "last_imported_at": expect.whatever(),
              "status": "Completed",
              "created_at": "2019-08-29T12:26:57.162Z",
              "email_body": "[html-body]\nEmail Body"
            },
            "event": "Email Sent"
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {},
          {
            "private_settings": {
              "fetch_email_events": true,
              "events_to_fetch": [
                "Email Sent",
                "Email Link Clicked",
                "Email Processed"
              ],
              "email_events_user_claims": [
                {
                  "hull": "email",
                  "service": "recipient"
                }
              ],
              "portal_id": 6015139,
              "refresh_token": "refresh_token",
              "token": "access_token",
              "events_last_fetch_started_at": expect.whatever()
            },
            "refresh_status": false
          }
        ]
      ]
    };
  });
});
