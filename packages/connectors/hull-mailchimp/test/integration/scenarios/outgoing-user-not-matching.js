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
  },
  {
    name: "otherTestSegment",
    id: "hullSegmentIdOther"
  }
];

it("should skip user who doesn't match the filter", () => {
  const email = "test@email.com";
  return testScenario(
    { connectorConfig },
    ({ handlers, nock, expect, minihullPort }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://mock.api.mailchimp.com/3.0");
          scope.get("/lists/1/webhooks").reply(200, {
            webhooks: [
              { url: "localhost:8000/mailchimp?ship=123456789012345678901234" }
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
            segments: [usersSegments[1]]
          }
        ],
        response: {
          flow_control: { in_time: 30000, in: 10, size: 50, type: "next" }
        },
        logs: [
          [
            "debug",
            "outgoing.user.start",
            expect.objectContaining({
              subject_type: "user",
              user_email: email
            }),
            { changes: {}, events: [], segments: ["otherTestSegment"] }
          ],
          ["debug", "outgoing.job.start", expect.whatever(), { messages: 1 }],
          ["debug", "outgoing.user.skip",
            expect.objectContaining({
              subject_type: "user",
              user_email: email
            }),
            {
              reason: "doesn't match whitelist"
            }
          ],
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
            "outgoing.job.success",
            expect.whatever(),
            { errors: 0, successes: 0 }
          ]
        ],
        firehoseEvents: [],
        metrics: [
          ["increment", "connector.request", 1],
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
    }
  );
});
