// @flow
import connectorConfig from "../../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";
process.env.COMBINED = true;

describe("Convert Leads Tests", () => {
  it("should convert lead to a user", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        connector: {
          private_settings: {
            access_token: "intercomABC",
            synchronized_segments: ["s1"],
            sync_fields_to_intercom: [
              { hull: 'email', name: 'email' },
              { hull: 'traits_intercom/name', name: 'name' }
            ],
            sync_fields_to_hull: [
              { name: 'email', hull: 'traits_intercom/email' },
              { name: 'name', hull: 'traits_intercom/name' },
              { name: 'phone', hull: 'traits_intercom/phone' }
            ]
          }
        },
        usersSegments: [
          { id: "s2", name: "Segment 2" }
        ],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://api.intercom.io");

          scope
            .post("/contacts/convert",
              {
                "contact": {
                  "user_id": "lead_user_id_1"
                },
                "user": {
                  "user_id": "user_id_1"
                }
              }).reply(200, {
              id: "webhook-id-1"
            });

          return scope;
        },
        messages: [
          {
            user: {
              id: "123",
              external_id: "user_id_1",
              email: "foo@bar.com",
              "traits_intercom/tags": ["Segment 2"],
              "name": "Bob",
              "intercom/name": "Bob Stein",
              "intercom/is_lead": true,
              "intercom/lead_user_id": "lead_user_id_1",
              "intercom/anonymous": false,
            },
            segments: [{ id: "s1", name: "Segment 1" }],
            changes: {
              segments: {
                left: [{ id: "s2", name: "Segment 2" }]
              }
            },
            events: []
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          [
            "debug",
            "outgoing.user.start",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "123",
              "user_email": "foo@bar.com",
              "user_external_id": "user_id_1"
            },
            {
              "changes": {
                "segments": {
                  "left": [
                    {
                      "id": "s2",
                      "name": "Segment 2"
                    }
                  ]
                }
              },
              "events": [],
              "segments": [
                "Segment 1"
              ]
            }
          ],
          ["debug", "outgoing.user", { "request_id": expect.whatever() },
            {
              "account": undefined,
              "id": "123",
              "external_id": "user_id_1",
              "email": "foo@bar.com",
              "intercom/tags": [
                "Segment 2"
              ],
              "name": "Bob",
              "intercom/name": "Bob Stein",
              "intercom/is_lead": true,
              "intercom/lead_user_id": "lead_user_id_1",
              "intercom/anonymous": false,
              "segment_ids": [
                "s1"
              ],
              "add_segment_ids": [
                "s1"
              ],
              "remove_segment_ids": [
                "s2"
              ]
            }
          ],
          [
            "debug",
            "connector.service_api.call",
            {
              "request_id": expect.whatever()
            },
            {
              "responseTime": expect.whatever(),
              "method": "POST",
              "url": "https://api.intercom.io/contacts/convert",
              "status": 200,
              "vars": {}
            }
          ]
        ],
        firehoseEvents: [
          ["traits",
            { "asUser": { "id": "123" }, "subjectType": "user" },
            { "intercom/is_lead": false }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","connector.service_api.response_time",expect.whatever()]
        ],
        platformApiCalls: []
      };
    });
  });
});
