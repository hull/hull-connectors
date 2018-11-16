// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");

// workaround to allow connector start
process.env.CLIENT_ID = "123";
const connectorServer = require("../../../server/server");
const connectorManifest = require("../../../manifest");

test("incoming fetch all responses basic", () => {
  return testScenario({ connectorServer, connectorManifest }, ({ handlers, requireFixture, expect, nock }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-all-responses",
      externalApiMock: () => {
        const scope = nock("https://api.typeform.com");
        scope.get("/forms/TYPEFORM1").reply(200, require("../fixtures/example-form"));
        scope.get("/forms/TYPEFORM1/responses").query({ completed: true }).reply(200, require("../fixtures/example-form-responses"))
        return scope;
      },
      connector: { private_settings: { form_id: "TYPEFORM1", field_as_email: "SMEUb7VJz92Q" } },
      usersSegments: [],
      accountsSegments: [],
      response: { response: "ok" },
      logs: [
        ["info", "incoming.job.start", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["info", "incoming.job.progress", expect.whatever(), { progress: 4 }],
        ["info", "incoming.user.success", { subject_type: "user", user_email: "lian1078@other.com" }, {}],
        [
          "info",
          "incoming.user-event.success",
          { subject_type: "user", user_email: "lian1078@other.com" },
          {
            event: "Form Submitted",
            eventProperties: {
            "form_title": "title",
            "form_id": "FORM1",
            "score": 2
            },
            eventContext: expect.whatever()
          }
        ],
        ["info", "incoming.user.success", { subject_type: "user", user_email: "sarahbsmith@example.com" }, {}],
        [
          "info",
          "incoming.user-event.success",
          {
            "subject_type": "user",
            "user_email": "sarahbsmith@example.com"
          },
          {
            "event": "Form Submitted",
            "eventProperties": {
              "form_title": "title",
              "form_id": "FORM1",
              "score": 4
            },
            "eventContext": expect.whatever()
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
        ["increment", "ship.incoming.users", 1]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            asUser: {
              email: "lian1078@other.com"
            },
            subjectType: "user"
          },
          {}
        ],
        [
          "track",
          {
            asUser: {
              email: "lian1078@other.com",
            },
            subjectType: "user"
          },
          expect.whatever()
        ],
        [
          "traits",
          {
            asUser: {
              email: "sarahbsmith@example.com"
            },
            subjectType: "user"
          },
          {}
        ],
        [
          "track",
          {
            asUser: {
              email: "sarahbsmith@example.com",
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
