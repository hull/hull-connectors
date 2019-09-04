/* @flow */
const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";


it("Basic fetch recent email events since last scheduled fetch - single event to fetch", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-email-events",
      connector: {
        private_settings: {
          fetch_email_events: true,
          events_to_fetch: [
            'Email Opened',
            'Email Deferred',
            'Email Dropped',
            'Email Reported As Spam'
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
        scope.get("/email/public/v1/events?limit=300&startTimestamp=1567082210396")
          .reply(200, require("./fixtures/events/hubspot-email-events"));
        scope.get("/email/public/v1/campaigns/10")
          .reply(200, { "contentId": 123});
        scope.get("/marketing-emails/v1/emails?id=123")
          .reply(200, {
            "objects": [
              {
                "id": 123,
                "primaryRichTextModuleHtml": "Email Body",
                "subject": "Newsletter"
              }
            ],
            "total": 1,
          });
        return scope;
      },
      response: { status : "deferred"},
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/email/public/v1/events", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/email/public/v1/campaigns/10", "status": 200, "vars": {} }],
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
              "id": "event_id_3",
              "recipient": "email@gmail.com",
              "sentBy": {
                "id": "sentById",
                "created": 1566582186465
              },
              "smtpId": null,
              "portalId": 6015139,
              "type": "OPEN",
              "filteredEvent": false,
              "appId": 113,
              "emailCampaignId": 10
            },
            "type": "hubspot_incoming_email_event"
          }
        ],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["track", { "asUser": { "email": "email@gmail.com", }, "subjectType": "user", },
          {
            "created_at": "2019-08-23T18:18:43.020Z",
            "event": "Email Opened",
            "event_id": "hubspot:6015139:event_id_3",
            "ip": null,
            "properties": {
              "created_at": "2019-08-23T18:18:43.020Z",
              "email_body": "[html-body]\nEmail Body",
              "email_campaign_id": 10,
              "email_id": "event_id_3",
              "email_subject": "OPEN - Newsletter",
              "last_imported_at": expect.whatever(),
              "portal_id": 6015139,
              "recipient": "email@gmail.com",
              "sent_by": "sentById"
            },
            "referer": null,
            "source": "hubspot",
            "type": "email",
            "url": null,
          },
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1,],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),],
        ["increment", "ship.service_api.call", 1,],
        ["value", "connector.service_api.response_time", expect.whatever(),]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {},],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {},
          {
            "private_settings": {
              "email_events_user_claims": [
                {
                  "hull": "email",
                  "service": "recipient",
                },
              ],
              "events_to_fetch": [
                'Email Opened',
                'Email Deferred',
                'Email Dropped',
                'Email Reported As Spam'
              ],
              "fetch_email_events": true,
              "events_last_fetch_started_at": expect.whatever(),
              "portal_id": 6015139,
              "refresh_token": "refresh_token",
              "token": "access_token",
            },
            "refresh_status": false,
          },
        ]
      ]
    };
  });
});
