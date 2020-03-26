// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

const companyPropertyGroups = require("../fixtures/get-properties-companies-groups");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["hullSegmentId"],
    outgoing_user_attributes: [
      { hull: "traits_custom_numeric", service: "custom_hubspot_numeric", overwrite: true },
      { hull: "traits_group/custom_calculated_score", service: "score", overwrite: true },
      { hull: "segments.name[]", service: "hull_segments", overwrite: true }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  { name: "testSegment", id: "hullSegmentId" },
  { name: "Unsynced Segment 1", id: "unsyncedSegment_1" },
  { name: "Unsynced Segment 2", id: "unsyncedSegment_2" }
];

/*
tests:
    1) valid user is resent
    2) user with both hubspot data failures and hull sync failures is not resent
    3) user with only hull sync failures is resent after connector sync
 */
it("should send out a new hull user to hubspot - validation error", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, [
            {
              "name": "contactinformation",
              "displayName": "Contact Information",
              "displayOrder": 0,
              "hubspotDefined": true,
              "properties": [
                {
                  "name": "custom_hubspot_numeric",
                  "label": "custom_hubspot_numeric",
                  "groupName": "contactinformation",
                  "type": "string",
                  "fieldType": "text"
                },
                {
                  "name": "score",
                  "label": "score",
                  "groupName": "contactinformation",
                  "type": "string",
                  "fieldType": "text"
                }
              ]
            }
          ]);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [
          {
            "properties": [
              { "property": "custom_hubspot_numeric", "value": "1/1/1" },
              { "property": "hull_segments", "value": "testSegment;Unsynced Segment 1" }
            ],
            "email": "bob@hull.io"
          },
          {
            "properties": [
              { "property": "score", "value": "some score" },
              { "property": "hull_segments", "value": "testSegment" }
            ],
            "email": "ron@hull.io"
          },
          {
            "properties": [
              { "property": "custom_hubspot_numeric", "value": "2/2/2" },
              { "property": "hull_segments", "value": "testSegment;Unsynced Segment 1;Unsynced Segment 2" }
            ],
            "email": "will@hull.io"
          }
        ]).reply(400, {
          "status": "error",
          "message": "Errors found processing batch update",
          "correlationId": "ac4096b2-a40e-47f3-9ae6-70a049e98947",
          "failureMessages": [
            {
              "index": 0,
              "propertyValidationResult": {
                "isValid": false,
                "message": "1/1/1 was not a valid long.",
                "error": "INVALID_LONG",
                "name": "custom_hubspot_numeric"
              }
            },
            {
              "index": 0,
              "propertyValidationResult": {
                "isValid": false,
                "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                "error": "INVALID_OPTION",
                "name": "hull_segments"
              }
            },
            {
              "index": 2,
              "propertyValidationResult": {
                "isValid": false,
                "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                "error": "INVALID_OPTION",
                "name": "hull_segments"
              }
            },
            {
              "index": 2,
              "propertyValidationResult": {
                "isValid": false,
                "message": "Unsynced Segment 2 was not one of the allowed options: ...",
                "error": "INVALID_OPTION",
                "name": "hull_segments"
              }
            }
          ],
          "requestId": "fe5445de05208abe5718281daf6d2bca"
        });

        scope.post("/contacts/v2/groups", { name: "hull", displayName: "Hull Properties", displayOrder: 1}).reply(202);
        scope.post("/contacts/v2/properties",
          {
            "options": [
              {
                "hidden": false,
                "description": null,
                "value": "testSegment",
                "readOnly": false,
                "doubleData": 0,
                "label": "testSegment",
                "displayOrder": 0
              },
              {
                "hidden": false,
                "description": null,
                "value": "Unsynced Segment 1",
                "readOnly": false,
                "doubleData": 0,
                "label": "Unsynced Segment 1",
                "displayOrder": 1
              },
              {
                "hidden": false,
                "description": null,
                "value": "Unsynced Segment 2",
                "readOnly": false,
                "doubleData": 0,
                "label": "Unsynced Segment 2",
                "displayOrder": 2
              }
            ],
            "description": "All the Segments the User belongs to in Hull",
            "label": "Hull Segments",
            "groupName": "hull",
            "fieldType": "checkbox",
            "formField": false,
            "name": "hull_segments",
            "type": "enumeration",
            "displayOrder": 0,
            "calculated": false
          }).reply(202);

        /*scope.post("/contacts/v2/properties",
          {
            "options": [],
            "description": "Some Custom Field Managed by Hull",
            "label": "Hull Custom Field",
            "groupName": "hull",
            "fieldType": "checkbox",
            "formField": false,
            "name": "hull_segments",
            "type": "enumeration",
            "displayOrder": 0
          }).reply(202);*/

        scope.post("/properties/v1/companies/groups", { name: "hull", displayName: "Hull Properties", displayOrder: 1}).reply(202);

        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [
          {
            "properties": [
              { "property": "score", "value": "some score" },
              { "property": "hull_segments", "value": "testSegment" }
            ],
            "email": "ron@hull.io"
          },
          {
            "properties": [
              { "property": "custom_hubspot_numeric", "value": "2/2/2" },
              { "property": "hull_segments", "value": "testSegment;Unsynced Segment 1;Unsynced Segment 2" }
            ],
            "email": "will@hull.io"
          }
        ]).reply(202);
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          user: {
            email: "bob@hull.io",
            custom_numeric: "1/1/1"
          },
          segments: [
            { name: "testSegment", id: "hullSegmentId" },
            { name: "Unsynced Segment 1", id: "unsyncedSegment_1" }
          ],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              entered: [
                {
                  id: "hullSegmentId",
                  name: "hullSegmentName",
                  type: "users_segment"
                }
              ]
            },
            account_segments: {}
          }
        },
        {
          user: {
            email: "ron@hull.io",
            "group/custom_calculated_score": "some score"
          },
          segments: [{
            name: "testSegment",
            id: "hullSegmentId"
          }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              entered: [
                {
                  id: "hullSegmentId",
                  name: "hullSegmentName",
                  type: "users_segment"
                }
              ]
            },
            account_segments: {}
          }
        },
        {
          user: {
            email: "will@hull.io",
            custom_numeric: "2/2/2"
          },
          segments: [
            {
              name: "testSegment",
              id: "hullSegmentId"
            },
            {
              name: "Unsynced Segment 1",
              id: "unsyncedSegment_1"
            },
            {
              name: "Unsynced Segment 2",
              id: "unsyncedSegment_2"
            }
          ],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              entered: [
                {
                  id: "hullSegmentId",
                  name: "hullSegmentName",
                  type: "users_segment"
                }
              ]
            },
            account_segments: {}
          }
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
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/contacts/v2/groups", "status": 200 })
        ]),
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/properties/v1/companies/groups", "status": 200, })
        ]),
        expect.arrayContaining([
          "outgoing.job.start",
          expect.objectContaining({ "toSkip": 0, "toInsert": 3, "toUpdate": 0 })
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/contacts/v1/contact/batch/", "status": 400, })
        ]),
        expect.arrayContaining([
          "outgoing.user.error",
          expect.objectContaining({ "subject_type": "user", "user_email": "bob@hull.io" }),
          expect.objectContaining({
            "error": "1/1/1 was not a valid long.",
            "hubspotWriteContact": {
              "properties": [
                {
                  "property": "custom_hubspot_numeric",
                  "value": "1/1/1"
                },
                {
                  "property": "hull_segments",
                  "value": "testSegment;Unsynced Segment 1"
                }
              ],
              "email": "bob@hull.io"
            }
          })
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/contacts/v2/groups", "status": 202, })
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/contacts/v2/properties", "status": 202, })
        ]),
        expect.arrayContaining([
          "ContactProperty.ensureCustomProperties"
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/properties/v1/companies/groups", "status": 202, })
        ]),
        expect.arrayContaining([
          "CompanyProperty.ensureCustomProperties"
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/contacts/v1/contact/batch/", "status": 202, })
        ]),
        expect.arrayContaining([
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "ron@hull.io" }),
          expect.objectContaining({
            "hubspotWriteContact": {
              "properties": [
                {
                  "property": "score",
                  "value": "some score"
                },
                {
                  "property": "hull_segments",
                  "value": "testSegment"
                }
              ],
              "email": "ron@hull.io"
            }
          })
        ]),
        expect.arrayContaining([
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "will@hull.io" }),
          expect.objectContaining({
            "hubspotWriteContact": {
              "properties": [
                {
                  "property": "custom_hubspot_numeric",
                  "value": "2/2/2"
                },
                {
                  "property": "hull_segments",
                  "value": "testSegment;Unsynced Segment 1;Unsynced Segment 2"
                }
              ],
              "email": "will@hull.io"
            }
          })
        ])
      ],
      firehoseEvents: [],
      metrics: [
        ["increment","connector.request",1],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","connector.service_api.error",1],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()],
        ["increment","ship.service_api.call",1],
        ["value","connector.service_api.response_time",expect.whatever()]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
