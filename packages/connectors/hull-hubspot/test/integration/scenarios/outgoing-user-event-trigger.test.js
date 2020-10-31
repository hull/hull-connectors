// @flow

import connectorConfig from "../../../server/config";
import manifest from "../../../manifest.json";

const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";


const private_settings = {
  token: "hubToken",
  portal_id: "123",
  send_events: true,
  synchronized_user_segments: ["hullSegmentId"],
  mark_deleted_contacts: false,
  mark_deleted_companies: false
};
const usersSegments = [
  { name: "testSegment", id: "hullSegmentId" }
];

it("should send out an event to hubspot", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
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
              vid: 1234,
              email: "email@email.com"
            }
          ])
          .reply(202);

        nock("https://track.hubspot.com")
          .get("/v1/event?_a=123&_n=Email%20Opened&email=email%40email.com")
          .reply(200, []);

        nock("https://track.hubspot.com")
          .get("/v1/event?_a=123&_n=Email%20Sent&email=email%40email.com")
          .reply(200, []);

        return scope;
      },
      connector: {
        private_settings: {
          ...private_settings,
          outgoing_user_events: ["Email Opened", "Email Sent"]
        }
      },
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email: "email@email.com",
            "hubspot/id": 1234
          },
          events: [
            { "event": "Email Opened" },
            { "event": "Random Event" },
            { "event": "Email Sent" },
          ],
          segments: [{ id: "hullSegmentId", name: "testSegment" }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {},
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
              vid: 1234,
              properties: [{ property: "hull_segments", value: "testSegment" }]
            }
          }
        ],
        [
          "info",
          "outgoing.event.success",
          expect.objectContaining({
            request_id: expect.whatever()
          }),
          {
            "event": {
              "_a": "123",
              "_n": "Email Opened",
              "email": "email@email.com",
            }
          }
        ],
        [
          "info",
          "outgoing.event.success",
          expect.objectContaining({
            request_id: expect.whatever()
          }),
          {
            "event": {
              "_a": "123",
              "_n": "Email Sent",
              "email": "email@email.com",
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


it("should not send out an event to hubspot", () => {
  return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
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

        return scope;
      },
      connector: {
        private_settings: {
          ...private_settings,
          outgoing_user_events: ["Email Sent"]
        }
      },
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email: "email@email.com",
            "hubspot/id": 1234
          },
          events: [
            {
              "event": "Email Opened",
              "event_id": "email_opened_1",
              "user_id": "user_id_1",
              "properties": {
                "emailCampaignId": "837382",
                "created": "1563746708853"
              },
              "event_source": "hubspot",
              "context": {}
            },
            {
              "event": "Random Event",
              "event_id": "random",
              "user_id": "user_id_1",
              "properties": {
                "emailCampaignId": "837382",
                "created": "1563746708853"
              },
              "event_source": "hubspot",
              "context": {}
            }
          ],
          segments: [{ id: "hullSegmentId", name: "testSegment" }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {},
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
          "outgoing.user.skip",
          expect.objectContaining({
            subject_type: "user",
            user_email: "email@email.com"
          }),
          {
            "reason": "No changes on any of the attributes for this user."
          }
        ]
      ],
      firehoseEvents: [],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)]
      ],
      platformApiCalls: []
    };
  });
});
