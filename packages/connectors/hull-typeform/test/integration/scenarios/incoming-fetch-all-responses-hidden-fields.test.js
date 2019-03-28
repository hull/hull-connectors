// @flow
declare function describe(name: string, callback: Function): void;
declare function before(callback: Function): void;
declare function beforeEach(callback: Function): void;
declare function afterEach(callback: Function): void;
declare function it(name: string, callback: Function): void;
declare function test(name: string, callback: Function): void;

const testScenario = require("hull-connector-framework/src/test-scenario");

// workaround to allow connector start
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";
import connectorConfig from "../../../server/config";

test("incoming fetch all responses hidden fields", () => {
  return testScenario({ connectorConfig }, ({ handlers, alterFixture, expect, nock }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-all-responses",
      externalApiMock: () => {
        const scope = nock("https://api.typeform.com");
        scope.get("/forms/TYPEFORM1").reply(200, require("../fixtures/example-form"));
        const responses = alterFixture(
          require("../fixtures/example-form-responses"), {
            items: [
              { hidden: { external_id: "abc1" } },
              { hidden: { external_id: "abc2" } },
              { hidden: { external_id: "abc3" } }
            ]
          }
        );
        scope.get("/forms/TYPEFORM1/responses").query({ completed: true }).reply(200, responses)
        return scope;
      },
      connector: { private_settings: { form_id: "TYPEFORM1" } },
      usersSegments: [],
      accountsSegments: [],
      response: { response: "ok" },
      logs: [
        ["info", "incoming.job.start", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["info", "incoming.job.progress", expect.whatever(), { progress: 4 }],
        ["info", "incoming.user.success", { subject_type: "user", user_external_id: "abc1" }, {}],
        [
          "info",
          "incoming.user-event.success",
          { subject_type: "user", user_external_id: "abc1" },
          {
            event: "Form Submitted",
            eventProperties: {
              external_id: "abc1",
              form_title: "title",
              form_id: "FORM1",
              score: 2
            },
            eventContext: expect.whatever()
          }
        ],
        ["info", "incoming.user.success", { subject_type: "user", user_external_id: "abc2" }, {}],
        [
          "info",
          "incoming.user-event.success",
          {
            subject_type: "user",
            user_external_id: "abc2"
          },
          {
            event: "Form Submitted",
            eventProperties: {
              external_id: "abc2",
              form_title: "title",
              form_id: "FORM1",
              score: 4
            },
            eventContext: expect.whatever()
          }
        ],
        ["info", "incoming.user.success", { subject_type: "user", user_external_id: "abc3" }, {}],
        [
          "info",
          "incoming.user-event.success",
          {
            subject_type: "user",
            user_external_id: "abc3"
          },
          {
            event: "Form Submitted",
            eventProperties: {
              external_id: "abc3",
              form_title: "title",
              form_id: "FORM1",
              score: 10
            },
            eventContext: expect.whatever()
          }
        ],
        [
          "info",
          "incoming.user.skip",
          {
            "subject_type": "user"
          },
          {
            "reason": "No identification claims defined, please refer to Identification section of documentation",
            "rawResponse": expect.whatever()
          }
        ],
        ["info", "incoming.job.success", expect.whatever(), expect.whatever()]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.incoming.users", 1]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              external_id: "abc1"
            },
            subjectType: "user"
          },
          {}
        ],
        [
          "track",
          {
            asUser: {
              external_id: "abc1"
            },
            subjectType: "user"
          },
          expect.whatever()
        ],
        [
          "traits",
          {
            asUser: {
              external_id: "abc2"
            },
            subjectType: "user"
          },
          {}
        ],
        [
          "track",
          {
            asUser: {
              external_id: "abc2"
            },
            subjectType: "user"
          },
          expect.whatever()
        ],
        [
          "traits",
          {
            asUser: {
              external_id: "abc3"
            },
            subjectType: "user"
          },
          {}
        ],
        [
          "track",
          {
            asUser: {
              external_id: "abc3"
            },
            subjectType: "user"
          },
          expect.whatever()
        ]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/app", {}, {}],
        ["GET", "/api/v1/users_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}],
        ["GET", "/api/v1/accounts_segments?shipId=9993743b22d60dd829001999", {"shipId": "9993743b22d60dd829001999"}, {}]
      ]
    };
  });
});
