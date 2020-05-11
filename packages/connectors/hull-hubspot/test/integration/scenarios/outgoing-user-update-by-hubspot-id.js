// @flow

import connectorConfig from "../../../server/config";
const testScenario = require("hull-connector-framework/src/test-scenario");
const contactPropertyGroups = [
  ...require("../fixtures/get-contacts-groups"),
  {
    "name": "hull",
    "displayName": "Hull Properties",
    "displayOrder": 1,
    "hubspotDefined": false,
    "properties": [
      {
        "name": "hull_segments",
        "label": "Hull Segments",
        "groupName": "hull",
        "type": "enumeration",
        "fieldType": "checkbox",
        "options": [],
        "readOnlyValue": false
      }
    ]
  }];

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["user_segment_1"],
    mark_deleted_contacts: false,
    mark_deleted_companies: false,
    outgoing_user_attributes: [
      { "hull": "first_name", "service": "firstname", "overwrite": false },
      { "hull": "'hubspot/email'", "service": "email", "overwrite": true },
      { "hull": "'hubspot/lead_status'[]", "service": 'hs_lead_status', "overwrite": true }, // str -> arr -> str
      { "hull": "traits_hubspot/hs_email_quarantined_reason", "service": "hs_email_quarantined_reason", "overwrite": true }, // arr -> str
      { "hull": "traits_hubspot/annualrevenue", "service": "annualrevenue", "overwrite": true }, // not in user message
      { "hull": "traits_hubspot/last name of person", "service": "lastname", "overwrite": true }, // spaces in hull attribute
      { "hull": "traits_hubspot lifecycle stage", "service": "lifecyclestage", "overwrite": true }, // missing trait group
      { "hull": "account.hubspot/industry", "service": "industry", "overwrite": true }, // single value arr -> str
      { "hull": "custom_attribute", "service": "hull_managed_attribute", "overwrite": true }, // create hull managed attribute
      { "hull": "traits_country (iso code)--", "service": "ip_country", "overwrite": true }, // parenthesis and spaces in trait
      { "hull": "traits_country-code", "service": "ip_country_code", "overwrite": true }, // dash in trait
      { "hull": "traits_salesforce_contact/department", "service": "department", "overwrite": true },
      { "hull": "traits_salesforce contact department", "service": "contact_department", "overwrite": true },
      { "hull": "segments.name[]", "service": "hull_segments", "overwrite": true }
    ]
  }
};
const usersSegments = [
  { name: "User Segment 1", id: "user_segment_1" },
  { name: "User Segment 2", id: "user_segment_2" }
];

it("should send out a hull user to hubspot using known hubspot id", () => {
  const email = "email@email.com";
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.notificationHandler,
      handlerUrl: "smart-notifier",
      channel: "user:update",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, contactPropertyGroups);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
            "properties": [
              {"property":"firstname","value":"bob"},
              {"property":"email","value":"email@email.com"},
              {"property":"hs_lead_status","value":"status 1"},
              {"property":"hs_email_quarantined_reason","value":"reason 1;reason 2;reason 3"},
              {"property":"lastname","value":"smith"},
              {"property":"lifecyclestage","value":"some stage"},
              {"property":"industry","value":"software"},
              {"property":"hull_managed_attribute","value":"some value"},
              {"property":"department","value": "software"},
              {"property":"hull_segments","value":"User Segment 1;User Segment 2"}
            ],
            "vid": "existingContactId",
            "email": "email@email.com"
          }]
        ).reply(202);
        return scope;
      },
      connector,
      usersSegments,
      accountsSegments: [],
      messages: [
        {
          account: {
            "hubspot/industry": ["software"]
          },
          user: {
            email,
            "first_name": "bob",
            "custom_attribute": "some value",
            "traits_hubspot/id": "existingContactId",
            "traits_hubspot/email": "email@email.com",
            "traits_hubspot lifecycle stage": "some stage",
            "traits_hubspot/lead_status": "status 1",
            "traits_hubspot/hs_email_quarantined_reason": ["reason 1", "reason 2", "reason 3"],
            "traits_hubspot/last name of person": "smith",
            "salesforce_contact/department": "software"
          },
          segments: [{ id: "user_segment_1", name: "User Segment 1" },{ id: "user_segment_2", name: "User Segment 2" }],
          changes: { segments: { left: [{ id: "5bffc38f625718d58b000004" }] } }
        }
      ],
      response: { flow_control: { in: 5, in_time: 10, size: 10, type: "next" } },
      logs: [
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "connector.service_api.call", expect.whatever(), expect.whatever()],
        ["debug", "outgoing.job.start", expect.whatever(), {"toInsert": 1, "toSkip": 0, "toUpdate": 0}],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "POST", "status": 202, "url": "/contacts/v1/contact/batch/" })],
        [
          "info",
          "outgoing.user.success",
          expect.objectContaining({ "subject_type": "user", "user_email": "email@email.com"}),
          { hubspotWriteContact: {"vid": "existingContactId", "email": "email@email.com",
              "properties": [
                {"property":"firstname","value":"bob"},
                {"property":"email","value":"email@email.com"},
                {"property":"hs_lead_status","value":"status 1"},
                {"property":"hs_email_quarantined_reason","value":"reason 1;reason 2;reason 3"},
                {"property":"lastname","value":"smith"},
                {"property":"lifecyclestage","value":"some stage"},
                {"property":"industry","value":"software"},
                {"property":"hull_managed_attribute","value":"some value"},
                {"property":"department","value":"software"},
                {"property":"hull_segments","value":"User Segment 1;User Segment 2"}
              ]
            }}
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
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
