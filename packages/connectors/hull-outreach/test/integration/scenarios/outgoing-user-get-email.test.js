// @flow
import connectorConfig from "../../../server/config";

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

/* global describe, it, beforeEach, afterEach */
const testScenario = require("hull-connector-framework/src/test-scenario");

test("send smart-notifier user update to outreach", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = require("../fixtures/notifier-payloads/outgoing-user-get-email.json");
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope
          .get("/api/v2/prospects/184816")
          .reply(
            200,
            require("../fixtures/api-responses/existing-prospect-hulk.json")
          );
        return scope;
      },
      response: {
        flow_control: {
          type: "next",
          in: 5,
          in_time: 10,
          size: 10
        }
      },
      logs: [
        [
          "info",
          "outgoing.job.start",
          expect.whatever(),
          { jobName: "Outgoing Data", type: "user" }
        ],
        [
          "info",
          "outgoing.user.skip",
          expect.whatever(),
          {
            reason:
            "User is not present in any of the defined segments to send to service.  Please either add a new synchronized segment which the user is present in the settings page, or add the user to an existing synchronized segment"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          {
            method: "GET",
            responseTime: expect.whatever(),
            status: 200,
            url: "/prospects/184816",
            vars: {}
          }
        ],
        [
          "info",
          "incoming.user.success",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "bruce@hulk.com",
            "user_anonymous_id": "outreach:184816"
          },
          {
            data: expect.whatever(),
            type: "Prospect"
          }
        ],
        [
          "info",
          "outgoing.job.success",
          expect.whatever(),
          { jobName: "Outgoing Data", type: "user" }
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              anonymous_id: "outreach:184816",
              email: "bruce@hulk.com"
            },
            subjectType: "user"
          },
          {
            "outreach/custom1": { operation: "set", value: null },
            "outreach/id": { operation: "set", value: 184816 }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});
