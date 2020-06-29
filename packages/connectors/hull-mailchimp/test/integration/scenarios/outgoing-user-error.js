// @flow
import connectorConfig from "../../../server/config";

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

it("should log member info when failure in sending user to mailchimp", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect, minihullPort }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://mock.api.mailchimp.com/3.0");
        scope.get("/lists/1/webhooks").reply(200, {
          webhooks: [
            { url: `https://localhost/mailchimp?organization=localhost%3A${minihullPort}&secret=1234&ship=123456789012345678901234` }
          ]
        });
        scope
          .post("/lists/1", {
            members: [
              {
                email_type: "html",
                merge_fields: {
                  FNAME: "",
                  LNAME: ""
                },
                interests: {
                  MailchimpInterestId: true
                },
                email_address: email,
                status_if_new: "subscribed"
              }
            ],
            update_existing: true
          })
          .reply(200, {
            errors: [
              {
                email_address: email,
                error: "Your merge fields were invalid."
              }
            ]
          });
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email
          },
          segments: [{ id: "hullSegmentId", name: "hullSegmentName" }]
        }
      ],
      response: {
        flow_control: {
          type: "next",
          in: 10,
          in_time: 30000,
          size: 50
        }
      },
      logs: [
        [
          "debug",
          "outgoing.user.start",
          expect.objectContaining({ subject_type: "user", user_email: email }),
          { changes: {}, events: [], segments: ["hullSegmentName"] }
        ],
        ["debug", "outgoing.job.start", expect.whatever(), { messages: 1 }],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "GET",
            url: "/lists/{{listId}}/webhooks"
          })
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({ method: "POST", url: "/lists/{{listId}}" })
        ],
        [
          "error",
          "outgoing.user.error",
          expect.objectContaining({ subject_type: "user", user_email: email }),
          {
            error: "Your merge fields were invalid.",
            member: {
              email_address: email,
              email_type: "html",
              interests: {
                MailchimpInterestId: true
              },
              merge_fields: {
                FNAME: "",
                LNAME: ""
              },
              status_if_new: "subscribed"
            }
          }
        ],
        [
          "debug",
          "outgoing.job.success",
          expect.whatever(),
          { errors: 1, successes: 0 }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        [
          "value",
          "connector.send_user_update_messages.time",
          expect.whatever()
        ],
        ["value", "connector.send_user_update_messages.messages", 1],
        ["increment", "ship.outgoing.users", 0]
      ]
    };
  });
});