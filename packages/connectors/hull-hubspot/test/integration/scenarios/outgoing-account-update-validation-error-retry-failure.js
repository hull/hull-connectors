// @flow
import connectorConfig from "../../../server/config";

const testScenario = require("hull-connector-framework/src/test-scenario");
const companyPropertyGroups = require("../fixtures/get-properties-companies-groups");

const contactPropertyGroups = [
  ...require("../fixtures/get-contacts-groups"),
  {
    "name": "hull",
    "displayName": "Hull Properties",
    "properties": [
      {
        "name": "hull_segments",
        "label": "Hull Segments",
        "description": "All the Segments the entity belongs to in Hull",
        "groupName": "hull",
        "options": []
      }
    ]
  }
];
process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "1234";
process.env.CLIENT_SECRET = "1234";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_account_segments: ["hullSegmentId"],
    outgoing_account_attributes: [
      { hull: "name", service: "name", overwrite: true },
      { hull: "account_segments.name[]", service: "hull_segments", overwrite: true }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const accountsSegments = [
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
];

it("should send out a new hull account to hubspot update validation error and retry", () => {
  const domain = "hull.io";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "account:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true").reply(200, contactPropertyGroups);
        scope
          .get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, companyPropertyGroups);
        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment"
                },
                {
                  name: "domain",
                  value: "hull.io"
                }
              ],
              objectId: "hubspot-company-1"
            },
            {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment;Unsynced Segment 1"
                },
                {
                  name: "domain",
                  value: "non-existing.com"
                }
              ],
              objectId: "hubspot-company-2"
            },
            {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment;Unsynced Segment 1;Unsynced Segment 2"
                },
                {
                  name: "domain",
                  value: "apple.com"
                }
              ],
              objectId: "hubspot-company-3"
            }
          ])
          .reply(400,
            {
              "status": "error",
              "message": "Property values were not valid",
              "correlationId": "d224cb01-46c7-40c3-aae9-223fe1ba3d82",
              "validationResults": [
                {
                  "isValid": false,
                  "message": "Property \"non-existing-property\" does not exist",
                  "error": "PROPERTY_DOESNT_EXIST",
                  "id": "hubspot-company-2",
                  "name": "non-existing-property"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "id": "hubspot-company-2",
                  "name": "hull_segments"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "id": "hubspot-company-3",
                  "name": "hull_segments"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 2 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "id": "hubspot-company-3",
                  "name": "hull_segments"
                }
              ],
              "requestId": "9cf667571bf00917f0224ea7e3ba5acc"
            }
          );

        scope.post("/properties/v1/companies/groups", { name: "hull", displayName: "Hull Properties", displayOrder: 1}).reply(202);
        scope.post("/properties/v1/companies/properties",
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
            "description": "All the Segments the entity belongs to in Hull",
            "label": "Hull Segments",
            "groupName": "hull",
            "fieldType": "checkbox",
            "formField": false,
            "name": "hull_segments",
            "calculated": false,
            "type": "enumeration",
            "displayOrder": 0
          }
        ).reply(202);

        scope
          .post("/companies/v1/batch-async/update?auditId=Hull", [
            {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment"
                },
                {
                  name: "domain",
                  value: "hull.io"
                }
              ],
              objectId: "hubspot-company-1"
            },
            {
              properties: [
                {
                  name: "name",
                  value: "New Name"
                },
                {
                  name: "hull_segments",
                  value: "testSegment;Unsynced Segment 1;Unsynced Segment 2"
                },
                {
                  name: "domain",
                  value: "apple.com"
                }
              ],
              objectId: "hubspot-company-3"
            }
          ])
          .reply(400,
            {
              "status": "error",
              "message": "Property values were not valid",
              "correlationId": "d224cb01-46c7-40c3-aae9-223fe1ba3d82",
              "validationResults": [
                {
                  "isValid": false,
                  "message": "some random error",
                  "error": "PROPERTY_DOESNT_EXIST",
                  "id": "hubspot-company-1",
                  "name": "non-existing-property"
                }
              ],
              "requestId": "9cf667571bf00917f0224ea7e3ba5acc"
            }
          );
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments,
      messages: [
        {
          changes: {
            is_new: false,
            user: {},
            account: {
              name: [
                "old",
                "New Name"
              ]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain,
            name: "New Name",
            "hubspot/id": "hubspot-company-1"
          },
          account_segments: [{ id: "hullSegmentId", name: "testSegment" }]
        },
        {
          changes: {
            is_new: false,
            user: {},
            account: {
              name: [
                "old",
                "New Name"
              ]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain: "non-existing.com",
            name: "New Name",
            "hubspot/id": "hubspot-company-2"
          },
          account_segments: [
            { name: "testSegment", id: "hullSegmentId" },
            { name: "Unsynced Segment 1", id: "unsyncedSegment_1" }
          ]
        },
        {
          changes: {
            is_new: false,
            user: {},
            account: { name: ["old", "New Name"] },
            segments: {},
            account_segments: {}
          },
          account: {
            domain: "apple.com",
            name: "New Name",
            "hubspot/id": "hubspot-company-3"
          },
          account_segments: [
            { name: "testSegment", id: "hullSegmentId" },
            { name: "Unsynced Segment 1", id: "unsyncedSegment_1" },
            { name: "Unsynced Segment 2", id: "unsyncedSegment_2" }
          ]
        }
      ],
      response: { flow_control: { type: "next" } },
      logs: [
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/contacts/v2/groups", "status": 200, })
        ]),
        expect.arrayContaining([
          expect.objectContaining({ "method": "GET", "url": "/properties/v1/companies/groups", "status": 200, })
        ]),
        ["debug", "outgoing.job.start", expect.whatever(), { toInsert: 0, toSkip: 0, toUpdate: 3 }],
        expect.arrayContaining([
          expect.objectContaining({ method: "POST", status: 400, url: "/companies/v1/batch-async/update" })
        ]),
        ["error", "outgoing.account.error",
          expect.objectContaining({
            account_domain: "non-existing.com",
            subject_type: "account"
          }),
          {
            error: 'Property "non-existing-property" does not exist',
            hubspotWriteCompany: {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment;Unsynced Segment 1", },
                { name: "domain", value: "non-existing.com" }
              ],
              objectId: "hubspot-company-2"
            }
          }
        ],
        expect.arrayContaining(["ContactProperty.ensureCustomProperties"]),
        expect.arrayContaining([
          expect.objectContaining({ "method": "POST", "url": "/properties/v1/companies/groups", "status": 202, })
        ]),
        expect.arrayContaining([
          expect.objectContaining({ "method": "POST", "url": "/properties/v1/companies/properties", "status": 202, })
        ]),
        expect.arrayContaining(["CompanyProperty.ensureCustomProperties"]),
        ["debug", "connector.service_api.call", expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 400,
            url: "/companies/v1/batch-async/update"
          })
        ],
        ["error", "outgoing.account.error",
          expect.objectContaining({
            account_domain: "hull.io",
            subject_type: "account"
          }),
          {
            error: 'some random error',
            hubspotWriteCompany: {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment" },
                { name: "domain", value: "hull.io" }
              ],
              objectId: "hubspot-company-1"
            }
          }
        ],
        ["error", "outgoing.account.error",
          expect.objectContaining({
            account_domain: "apple.com",
            subject_type: "account"
          }),
          {
            error: 'outgoing batch rejected',
            hubspotWriteCompany: {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment;Unsynced Segment 1;Unsynced Segment 2" },
                { name: "domain", value: "apple.com" }
              ],
              objectId: "hubspot-company-3"
            }
          }
        ]
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
          ["increment","connector.service_api.error",1]
      ],
      platformApiCalls: []
    };
  });
});
