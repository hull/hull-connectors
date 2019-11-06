// @flow
import connectorConfig from "../../../server/config";

const _ = require("lodash");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const testScenario = require("hull-connector-framework/src/test-scenario");

test("send smart-notifier user update to outreach and link account", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    const updateMessages = _.cloneDeep(
      require("../fixtures/notifier-payloads/outgoing-user-link-new-account.json")
    );
    return _.assign(updateMessages, {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.outreach.io");
        scope
          .get("/api/v2/accounts/?filter[domain]=afterlife.com")
          .reply(200, { data: [] });
        scope
          .post("/api/v2/accounts/", {
            data: {
              type: "account",
              attributes: {
                domain: "afterlife.com",
                custom20: "very hot",
                name: "afterlife.com"
              }
            }
          })
          .reply(422);
        scope
          .intercept("/api/v2/prospects/18", "PATCH", {
            data: {
              type: "prospect",
              id: 18,
              attributes: { custom20: "in the afterlife" }
            }
          })
          .reply(
            200,
            require("../fixtures/api-responses/outgoing-user-link-patch-user.json")
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
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          {
            method: "GET",
            responseTime: expect.whatever(),
            status: 200,
            url: "/accounts/",
            vars: {}
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          {
            method: "POST",
            responseTime: expect.whatever(),
            status: 422,
            url: "/accounts/",
            vars: {}
          }
        ],
        [
          "error",
          "outgoing.account.skip",
          {
            account_domain: "afterlife.com",
            account_id: "5c0fd68ad884b4373800011a",
            request_id: expect.whatever(),
            subject_type: "account"
          },
          {
            data: expect.whatever(),
            operation: "post",
            type: "Account",
            error:
              "Outreach has rejected the objects being sent, please review attributes that you have in your filters to make sure that you've selected all the fields that outreach requires, if you think this is correct, please contact Hull support"
          }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          {
            method: "PATCH",
            responseTime: expect.whatever(),
            status: 200,
            url: "/prospects/18",
            vars: {}
          }
        ],
        [
          "info",
          "outgoing.user.success",
          {
            request_id: expect.whatever(),
            subject_type: "user",
            user_email: "fettisbest@gmail.com",
            user_id: "5bd329d5e2bcf3eeaf00009f"
          },
          {
            data: {
              data: {
                attributes: { custom20: "in the afterlife" },
                id: 18,
                type: "prospect"
              }
            },
            operation: "patch",
            type: "Prospect"
          }
        ],
        [
          "debug", "incoming.user.success",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "fettisbest@gmail.com",
            "user_anonymous_id": "outreach:18"
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
              anonymous_id: "outreach:18",
              email: "fettisbest@gmail.com"
            },
            subjectType: "user"
          },
          {
            "outreach/custom1": {
              operation: "set",
              value: "probably is a smuggler too"
            },
            "outreach/id": { operation: "set", value: 18 },
            "outreach/personalnote2": {
              operation: "set",
              value:
                "froze han solo in carbinite, he was just a kid!  He's very efficient"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "connector.service_api.error", 1],
        ["increment", "service.service_api.errors", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()]
      ]
    });
  });
});
