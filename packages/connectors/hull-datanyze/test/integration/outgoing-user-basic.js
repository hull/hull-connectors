// @flow

import connectorConfig from "../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";
process.env.COMBINED = "true";

const connector = {
  private_settings: {
    token: "datanyzeABC",
    username: "datanyzeDEF",
    synchronized_segments: ["B"],
    target_trait: "domain"
  }
};

it("should update user", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("http://api.datanyze.com");
        scope.get("/limits/?token=datanyzeABC&email=datanyzeDEF")
          .reply(200, {});

        scope.get("/domain_info/?token=datanyzeABC&email=datanyzeDEF&domain=foo.bar&tech_details=true")
          .reply(200, {
            foo: "bar",
            mobile: { crazy: "Stuff" },
            technologies: [
              {
                name: "scala",
              }, {
                name: "react",
              }
            ]
          });

        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      messages: [
        {
          user: { email: "foo@bar.com", domain: "foo.bar" },
          changes: [],
          events: [],
          segments: [{ id: "B" }]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        [
          "info",
          "outgoing.user.start",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "foo@bar.com"
          },
          undefined
        ],
        [
          "debug",
          "datanyze.request",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "foo@bar.com"
          },
          {
            "path": "limits"
          }
        ],
        [
          "debug",
          "datanyze.request",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "foo@bar.com"
          },
          {
            "path": "domain_info",
            "domain": "foo.bar",
            "tech_details": true
          }
        ],
        [
          "debug",
          "outgoing.user.fetch.response",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "foo@bar.com"
          },
          {
            "response": {
              "foo": "bar",
              "technologies": [
                {
                  "name": "scala"
                },
                {
                  "name": "react"
                }
              ]
            }
          }
        ],
        [
          "info",
          "outgoing.user.success",
          {
            "subject_type": "user",
            "request_id": expect.whatever(),
            "user_email": "foo@bar.com"
          },
          undefined
        ]
      ],
      firehoseEvents: [
        [
          "traits",
          {
            "asUser": {
              "email": "foo@bar.com"
            },
            "subjectType": "user"
          },
          {
            "datanyze/foo": "bar",
            "datanyze/technologies": [
              "scala",
              "react"
            ],
            "datanyze/fetched_at": expect.whatever()
          }
        ]
      ],
      metrics: [
        ["increment","connector.request",1],
        ["value","ship.service_api.remaining",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["increment","ship.outgoing.users",1]
      ],
      platformApiCalls: []
    };
  });
});
