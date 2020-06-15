// @flow

import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";


const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["hullSegmentId"],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  { name: "testSegment", id: "hullSegmentId" }
];

it("should send out a new hull user to hubspot - user basic", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, [
          {
            "name": "contactinformation",
            "displayName": "Contact Information",
            "properties": [
              {
                "name": "email",
                "label": "Email",
                "description": "A contact's email address",
                "groupName": "contactinformation",
                "type": "string",
                "fieldType": "text",
                "readOnlyValue": false
              }
            ]
          }
        ]);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope
          .post("/contacts/v1/contact/batch/?auditId=Hull", [
            {
              properties: [
                {
                  property: "hull_segments",
                  value: "testSegment"
                }
              ],
              email: "email@email.com"
            }
          ])
          .reply(202);
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
          segments: [{ id: "hullSegmentId", name: "testSegment" }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              left: [
                {
                  id: "5bffc38f625718d58b000004",
                  name: "Smugglers",
                  updated_at: "2018-12-06T14:23:38Z",
                  type: "users_segment",
                  created_at: "2018-11-29T10:46:39Z"
                }
              ]
            },
            account_segments: {}
          }
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.whatever()
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.whatever()
        ],
        [
          "debug",
          "outgoing.job.start",
          expect.whatever(),
          { toInsert: 1, toSkip: 0, toUpdate: 0 }
        ],
        [
          "debug",
          "connector.service_api.call",
          expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 202,
            url: "/contacts/v1/contact/batch/"
          })
        ],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({
            subject_type: "user",
            user_email: "email@email.com"
          }),
          {
            hubspotWriteContact: {
              email: "email@email.com",
              properties: [{ property: "hull_segments", value: "testSegment" }]
            }
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});
