// @flow
/* global describe, it, beforeEach, afterEach */
declare function describe(name:string, callback:Function):void;
declare function before(callback:Function):void;
declare function beforeEach(callback:Function):void;
declare function it(name:string, callback:Function):void;

const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

process.env.MAILCHIMP_CLIENT_ID = "1234";
process.env.MAILCHIMP_CLIENT_SECRET = "1234";

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

it("should remove user from static list if user left the segment", () => {
  const email = "mocked@email.com";
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, nock, expect, minihullPort }) => {
    const userClaims = expect.objectContaining({ subject_type: "user", user_email: email });
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://mock.api.mailchimp.com/3.0");
        scope.get("/lists/1/webhooks")
          .reply(200, {
            webhooks: [
              { url: `localhost:8000/mailchimp?ship=123456789012345678901234` }
            ]
          });
        scope.post("/lists/1", {
          members: [
            {
              email_type: "html",
              merge_fields: {
                FNAME: "",
                LNAME: ""
              },
              interests: {
                MailchimpInterestId: false
              },
              email_address: email,
              status_if_new: "subscribed"
            }
          ],
          update_existing: true
        })
        .reply(200);
        scope.post("/lists/1/segments/MailchimpSegmentId", {
          members_to_add: [],
          members_to_remove: [email]
        })
          .reply(200);
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email,
            "traits_mailchimp/unique_email_id": "1234"
          },
          segments: [],
          changes: {
            segments: {
              left: [{ id: "hullSegmentId" }]
            }
          }
        }
      ],
      response: { flow_control: { "in": 10, "in_time": 30000, "size": 50, "type": "next" } },
      logs: [
        [
          "debug",
          "outgoing.user.start",
          userClaims,
          { changes: {
            segments: {
              left: [{ id: "hullSegmentId" }]
            }
          }, events: [], segments: [] }
        ],
        ["debug", "outgoing.job.start", expect.whatever(), { messages: 1 }],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/lists/{{listId}}/webhooks" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "POST", url: "/lists/{{listId}}" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "POST", url: "/lists/{{listId}}/segments/{{staticSegmentId}}" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ subject_type: "user", user_email: email }),
          {
            member: {
              email_address: "mocked@email.com",
              email_type: "html",
              interests: {
                MailchimpInterestId: false,
              },
              merge_fields: {
                FNAME: "",
                LNAME: ""
              },
              status_if_new: "subscribed",
            },
          }
        ],
        ["debug", "outgoing.job.success", expect.whatever(), { errors: 0, successes: 1 }],
        // ["debug", "getMemberActivities", expect.whatever(), expect.whatever()],
        // ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/lists/{{listId}}/members/{{emailId}}/activity" })],
        // ["debug", "trackEvents", expect.whatever(), expect.whatever()],
        // ["info", "incoming.event.success", userClaims, expect.objectContaining({ action: "open" })],
        // ["info", "incoming.event.success", userClaims, expect.objectContaining({ action: "sent" })],
        // ["info", "incoming.event.success", userClaims, expect.objectContaining({ action: "mandrill_send" })],
        // ["info", "incoming.event.success", userClaims, expect.objectContaining({ action: "mandrill_open" })]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["value", "connector.send_user_update_messages.time", expect.whatever()],
        ["value", "connector.send_user_update_messages.messages", 1],
        ["increment", "ship.outgoing.users", 1]
      ]
    };
  });
});
