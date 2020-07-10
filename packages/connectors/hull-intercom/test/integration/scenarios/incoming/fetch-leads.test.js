// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Fetch Lead and Users Tests", () => {
  it("should fetch all leads", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.jsonHandler,
        handlerUrl: "fetchAllLeads",
        connector: {
          private_settings: {
            access_token: "intercomABC"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .get("/contacts/scroll?scroll_param")
            .reply(200, {
              "pages": null,
              "total_count": 0,
              "limited": false,
              "type": "contact.list",
              "scroll_param": "6aeb1cb9-f1b4-4ee9-b924-f63456075bbc",
              "contacts": [
                {
                  email: "foo@bar.com",
                  user_id: "1",
                  updated_at: "1593702734"
                },
                {
                  user_id: "2",
                  updated_at: "1593702674"
                }, {
                  email: "skip@it.com",
                  user_id: "3",
                  updated_at: "1593612734"
                }
              ]
            });

          scope
            .get("/contacts/scroll?scroll_param")
            .reply(200, {
              "pages": null,
              "total_count": 0,
              "limited": false,
              "type": "contact.list",
              "contacts": [],
              "scroll_param": "9ee5d831-da25-4c96-b075-ffacde7ad14f"
            });

          scope
            .get("/contacts/scroll?scroll_param")
            .reply(404, {
              "type": "error.list",
              "request_id": "004p703u06c0dio74rs0",
              "errors": [
                {
                  "code": "not_found",
                  "message": "scroll parameter not found"
                }
              ]
            });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "debug",
            "dispatch",
            {},
            {
              "id": expect.whatever(),
              "name": "fetchAllLeads"
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/contacts/scroll",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/contacts/scroll",
              "status": 200,
              "vars": {}
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "foo@bar.com",
              "user_anonymous_id": "intercom:1"
            },
            {
              "traits": {
                "email": {
                  "operation": "setIfNull",
                  "value": "foo@bar.com"
                },
                "intercom/email": {
                  "operation": "setIfNull",
                  "value": "foo@bar.com"
                },
                "intercom/updated_at": {
                  "operation": "setIfNull",
                  "value": "1593702734"
                },
                "intercom/is_lead": true,
                "intercom/lead_user_id": "1"
              }
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_anonymous_id": "intercom:2"
            },
            {
              "traits": {
                "intercom/updated_at": {
                  "operation": "setIfNull",
                  "value": "1593702674"
                },
                "intercom/is_lead": true,
                "intercom/lead_user_id": "2"
              }
            }
          ],
          [
            "debug",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "skip@it.com",
              "user_anonymous_id": "intercom:3"
            },
            {
              "traits": {
                "email": {
                  "operation": "setIfNull",
                  "value": "skip@it.com"
                },
                "intercom/email": {
                  "operation": "setIfNull",
                  "value": "skip@it.com"
                },
                "intercom/updated_at": {
                  "operation": "setIfNull",
                  "value": "1593612734"
                },
                "intercom/is_lead": true,
                "intercom/lead_user_id": "3"
              }
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {},
            {
              "responseTime": expect.whatever(),
              "method": "GET",
              "url": "https://api.intercom.io/contacts/scroll",
              "status": 404,
              "vars": {}
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "foo@bar.com",
                "anonymous_id": "intercom:1"
              },
              "subjectType": "user"
            },
            {
              "email": {
                "operation": "setIfNull",
                "value": "foo@bar.com"
              },
              "intercom/email": {
                "operation": "setIfNull",
                "value": "foo@bar.com"
              },
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": "1593702734"
              },
              "intercom/is_lead": true,
              "intercom/lead_user_id": "1"
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "anonymous_id": "intercom:2"
              },
              "subjectType": "user"
            },
            {
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": "1593702674"
              },
              "intercom/is_lead": true,
              "intercom/lead_user_id": "2"
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "email": "skip@it.com",
                "anonymous_id": "intercom:3"
              },
              "subjectType": "user"
            },
            {
              "email": {
                "operation": "setIfNull",
                "value": "skip@it.com"
              },
              "intercom/email": {
                "operation": "setIfNull",
                "value": "skip@it.com"
              },
              "intercom/updated_at": {
                "operation": "setIfNull",
                "value": "1593612734"
              },
              "intercom/is_lead": true,
              "intercom/lead_user_id": "3"
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.job.fetchAllLeads.start",1],
          ["value","ship.job.fetchAllLeads.duration",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()],
          ["increment","connector.service_api.error",1]
        ],
        platformApiCalls: [
          ["GET","/api/v1/app",{},{}],
          ["GET","/api/v1/users_segments?shipId=9993743b22d60dd829001999",{"shipId":"9993743b22d60dd829001999"},{}],
          ["GET","/api/v1/accounts_segments?shipId=9993743b22d60dd829001999",{"shipId":"9993743b22d60dd829001999"},{}]
        ]
      };
    });
  });
});
