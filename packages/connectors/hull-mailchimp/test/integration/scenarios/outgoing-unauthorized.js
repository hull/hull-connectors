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

it("Api token invalid", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      connector,
      usersSegments,
      accountsSegments: [],
      externalApiMock: () => {
        const scope = nock("https://mock.api.mailchimp.com/3.0");
        scope.get("/lists/1/webhooks").reply(401, {
          type:
            "http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/",
          title: "API Key Invalid",
          status: 401,
          detail:
            "Your API key may be invalid, or you've attempted to access the wrong datacenter.",
          instance: "c9e2c425-29d5-4cf9-8a96-2966b53315b6"
        });
        return scope;
      },
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
          type: "retry",
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
          "warn",
          "webhook.error",
          expect.whatever(),
          {
            errors: "Invalid API key",
            step: "creating"
          }
        ],
        [
          "error",
          "outgoing.job.error",
          expect.whatever(),
          {
            error: "Invalid API key",
            stack: expect.any(String),
            type: "notification"
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1]
      ]
    };
  });
});
