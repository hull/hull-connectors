// @flow
/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");
const connectorServer = require("../../../server/server");

process.env.OVERRIDE_HUBSPOT_URL = "";

const connector = {
  private_settings: {}
};
const usersSegments = [
  {
    name: "testSegment",
    id: "hullSegmentId"
  }
];

it.skip("should send out an user to hubspot", () => {
  const email = "email@email.com";
  return testScenario({ connectorServer }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        // scope.post("/lists/1", {
        //     members: [
        //       {
        //         email_type: "html",
        //         merge_fields: {},
        //         interests: {
        //           MailchimpInterestId: true
        //         },
        //         email_address: email,
        //         status_if_new: "subscribed"
        //       }
        //     ],
        //     update_existing: true
        //   })
        //   .reply(200);
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
          in: 5,
          in_time: 10,
          size: 10,
          type: "next"
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
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "GET", url: "/lists/{{listId}}/webhooks" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ method: "POST", url: "/lists/{{listId}}" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ subject_type: "user", user_email: email }),
          {
            member: {
              email_address: email,
              email_type: "html",
              interests: {
                MailchimpInterestId: true,
              },
              merge_fields: {},
              status_if_new: "subscribed"
            }
          }
        ],
        ["debug", "outgoing.job.success", expect.whatever(), { errors: 0, successes: 1 }]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
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
