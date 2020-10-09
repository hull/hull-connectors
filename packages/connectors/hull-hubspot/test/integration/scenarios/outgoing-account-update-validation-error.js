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
    mark_deleted_contacts: false,
    mark_deleted_companies: false,
    outgoing_account_attributes: [
      { "service": "about_us", "hull": "hubspot/about_us" },
      { "service": "address", "hull": "hubspot/address" },
      { "service": "address2", "hull": "hubspot/address2" },
      { "service": "annualrevenue", "hull": "hubspot/annualrevenue" },
      { "service": "city", "hull": "hubspot/city" },
      { "service": "closedate", "hull": "hubspot/close_date" },
      { "service": "country", "hull": "hubspot/country" },
      { "service": "description", "hull": "hubspot/description" },
      { "service": "domain", "hull": "hubspot/domain" },
      { "service": "facebook_company_page", "hull": "hubspot/facebook_company_page" },
      { "service": "facebookfans", "hull": "hubspot/facebookfans" },
      { "service": "founded_year", "hull": "hubspot/founded_year" },
      { "service": "googleplus_page", "hull": "hubspot/googleplus_page" },
      { "service": "hs_analytics_source", "hull": "hubspot/hs_analytics_source" },
      { "service": "hs_lead_status", "hull": "hubspot/hs_lead_status" },
      { "service": "hubspot_owner_id", "hull": "hubspot/hubspot_owner_id" },
      { "service": "industry", "hull": "hubspot/industry" },
      { "service": "is_public", "hull": "hubspot/is_public" },
      { "service": "lifecyclestage", "hull": "hubspot/lifecyclestage" },
      { "service": "linkedin_company_page", "hull": "hubspot/linkedin_company_page" },
      { "service": "linkedinbio", "hull": "hubspot/linkedinbio" },
      { "service": "name", "hull": "hubspot/name" },
      { "service": "numberofemployees", "hull": "hubspot/numberofemployees" },
      { "service": "phone", "hull": "hubspot/phone" },
      { "service": "state", "hull": "hubspot/state" },
      { "service": "timezone", "hull": "hubspot/timezone" },
      { "service": "total_money_raised", "hull": "hubspot/total_money_raised" },
      { "service": "twitterbio", "hull": "hubspot/twitterbio" },
      { "service": "twitterfollowers", "hull": "hubspot/twitterfollowers" },
      { "service": "twitterhandle", "hull": "hubspot/twitterhandle" },
      { "service": "type", "hull": "hubspot/type" },
      { "service": "web_technologies", "hull": "hubspot/web_technologies" },
      { "service": "website", "hull": "hubspot/website" },
      { "service": "zip", "hull": "hubspot/zip" },
      { "service": "hull_segments", "hull": "account_segments.name[]", "overwrite": true }
    ]
  }
};
const accountsSegments = [
  { name: "testSegment", id: "hullSegmentId" },
  { name: "Unsynced Segment 1", id: "unsyncedSegment_1" },
  { name: "Unsynced Segment 2", id: "unsyncedSegment_2" }
];

/*
tests:
    1) valid account is resent
    2) account with both hubspot data failures and hull sync failures is not resent
    3) account with only hull sync failures is resent after connector sync
 */
it("should send out a new hull account to hubspot update validation error", () => {
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
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment" },
                { name: "domain", value: "hull.io" }
              ],
              objectId: "hubspot-company-1"
            },
            {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment;Unsynced Segment 1" },
                { name: "domain", value: "non-existing.com" }
              ],
              objectId: "hubspot-company-2"
            },
            {
              properties: [
                { name: "name", value: "New Name" },
                { name: "hull_segments", value: "testSegment;Unsynced Segment 1;Unsynced Segment 2" },
                { name: "domain", value: "apple.com" }
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
                  "name": "non-existing-property"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "name": "hull_segments"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 1 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "name": "hull_segments"
                },
                {
                  "isValid": false,
                  "message": "Unsynced Segment 2 was not one of the allowed options: ...",
                  "error": "INVALID_OPTION",
                  "name": "hull_segments"
                },
                {
                  "isValid": false,
                  "message": "thisstring was not a valid number.",
                  "error": "INVALID_INTEGER",
                  "name": "numberofemployees"
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
            "type": "enumeration",
            "calculated": false,
            "displayOrder": 0
          }
        ).reply(202);

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
            account: { "hubspot/name": ["old", "New Name"]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain,
            "hubspot/name": "New Name",
            "hubspot/id": "hubspot-company-1"
          },
          account_segments: [{ id: "hullSegmentId", name: "testSegment" }]
        },
        {
          changes: {
            is_new: false,
            user: {},
            account: {
              "hubspot/name": ["old", "New Name"]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain: "non-existing.com",
            "hubspot/name": "New Name",
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
            account: {
              "hubspot/name": ["old", "New Name"]
            },
            segments: {},
            account_segments: {}
          },
          account: {
            domain: "apple.com",
            "hubspot/name": "New Name",
            "hubspot/id": "hubspot-company-3"
          },
          account_segments: [
            { name: "testSegment", id: "hullSegmentId" },
            { name: "Unsynced Segment 1", id: "unsyncedSegment_1" },
            { name: "Unsynced Segment 2", id: "unsyncedSegment_2" }
          ]
        }
      ],
      response: {
        flow_control: {
          type: "next"
        }
      },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), { toInsert: 0, toSkip: 0, toUpdate: 3 }],
        ["debug", "connector.service_api.call", expect.whatever(),
          expect.objectContaining({
            method: "POST",
            status: 400,
            url: "/companies/v1/batch-async/update"
          }
        )],
        [
          "error",
          "outgoing.account.error",
          {
            "subject_type": "account",
            "request_id": expect.whatever(),
            "account_domain": "hull.io"
          },
          {
            "error": "Batch Rejected: Property \"non-existing-property\" does not exist; thisstring was not a valid number.",
            "warning": "Unable to determine rejected account",
            "hubspotWriteCompany": {
              "properties": [
                {
                  "name": "name",
                  "value": "New Name"
                },
                {
                  "name": "hull_segments",
                  "value": "testSegment"
                },
                {
                  "name": "domain",
                  "value": "hull.io"
                }
              ],
              "objectId": "hubspot-company-1"
            }
          }
        ],
        [
          "error",
          "outgoing.account.error",
          {
            "subject_type": "account",
            "request_id": expect.whatever(),
            "account_domain": "non-existing.com"
          },
          {
            "error": "Batch Rejected: Property \"non-existing-property\" does not exist; thisstring was not a valid number.",
            "warning": "Unable to determine rejected account",
            "hubspotWriteCompany": {
              "properties": [
                {
                  "name": "name",
                  "value": "New Name"
                },
                {
                  "name": "hull_segments",
                  "value": "testSegment;Unsynced Segment 1"
                },
                {
                  "name": "domain",
                  "value": "non-existing.com"
                }
              ],
              "objectId": "hubspot-company-2"
            }
          }
        ],
        [
          "error",
          "outgoing.account.error",
          {
            "subject_type": "account",
            "request_id": expect.whatever(),
            "account_domain": "apple.com"
          },
          {
            "error": "Batch Rejected: Property \"non-existing-property\" does not exist; thisstring was not a valid number.",
            "warning": "Unable to determine rejected account",
            "hubspotWriteCompany": {
              "properties": [
                {
                  "name": "name",
                  "value": "New Name"
                },
                {
                  "name": "hull_segments",
                  "value": "testSegment;Unsynced Segment 1;Unsynced Segment 2"
                },
                {
                  "name": "domain",
                  "value": "apple.com"
                }
              ],
              "objectId": "hubspot-company-3"
            }
          }
        ],
        expect.arrayContaining([
          "ContactProperty.ensureCustomProperties"
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/properties/v1/companies/groups", "status": 202 })
        ]),
        expect.arrayContaining([
          "connector.service_api.call",
          expect.objectContaining({ "method": "POST", "url": "/properties/v1/companies/properties", "status": 202 })
        ]),
        expect.arrayContaining([
          "CompanyProperty.ensureCustomProperties"
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
          ["value","connector.service_api.response_time",expect.whatever()]
      ],
      platformApiCalls: []
    };
  });
});
