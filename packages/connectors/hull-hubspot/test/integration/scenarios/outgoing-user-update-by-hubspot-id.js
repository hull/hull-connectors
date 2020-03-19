// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
import connectorConfig from "../../../server/config";

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["user_segment_1"],
    outgoing_user_attributes: [
      { "service": "hs_lead_status", "hull": "hubspot/lead_status" },
      { "service": "firstname", "hull": "hubspot/first_name" },
      { "service": "lastname", "hull": "hubspot/last_name" },
      { "service": "salutation", "hull": "hubspot/salutation" },
      { "service": "email", "hull": "email" },
      { "service": "mobilephone", "hull": "hubspot/mobile_phone" },
      { "service": "phone", "hull": "hubspot/phone" },
      { "service": "fax", "hull": "hubspot/fax" },
      { "service": "address", "hull": "hubspot/address_street" },
      { "service": "hubspot_owner_id", "hull": "hubspot/hubspot_owner_id" },
      { "service": "city", "hull": "hubspot/address_city" },
      { "service": "state", "hull": "hubspot/address_state" },
      { "service": "zip", "hull": "hubspot/address_postal_code" },
      { "service": "country", "hull": "hubspot/address_country" },
      { "service": "jobtitle", "hull": "hubspot/job_title" },
      { "service": "message", "hull": "hubspot/message" },
      { "service": "closedate", "hull": "hubspot/closed_at" },
      { "service": "lifecyclestage", "hull": "hubspot/lifecycle_stage" },
      { "service": "company", "hull": "hubspot/company" },
      { "service": "website", "hull": "hubspot/website" },
      { "service": "numemployees", "hull": "hubspot/employees_count" },
      { "service": "annualrevenue", "hull": "hubspot/annual_revenue" },
      { "service": "industry", "hull": "hubspot/industry" },
      { "service": "associatedcompanyid", "hull": "hubspot/associatedcompanyid" }
    ],
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};
const usersSegments = [
  {
    name: "User Segment 1",
    id: "user_segment_1"
  }
];

it("should send out a hull user with all default fields", () => {
  const email = "email@email.com";
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
              "name": "emailinformation", "fulcrumPortalId": 0, "displayName": "Email Information", "displayOrder": 3, "hubspotDefined": true,
              "properties": [
                {"name": "hs_email_open", "label": "Marketing emails opened", "groupName": "emailinformation", "type": "number", "readOnlyValue": true, "fieldType": "number" },
                {"name": "hs_email_bounce", "label": "Marketing emails bounced", "groupName": "emailinformation", "type": "number", "readOnlyValue": true, "fieldType": "number" },
                {"name": "hs_email_optout", "label": "Unsubscribed from all email", "groupName": "emailinformation", "type": "bool", "readOnlyValue": true, "fieldType": "booleancheckbox" }
              ]
            },
            {
              "name": "contactinformation", "displayName": "Contact Information", "displayOrder": 0, "hubspotDefined": true,
              "properties": [
                {"name": "request_country", "label": "request_country", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "days_to_close", "label": "Days To Close", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "first_deal_created_date", "label": "First Deal Created Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lead_status", "label": "Lead Status", "groupName": "contactinformation", "type": "enumeration", "readOnlyValue": false, "fieldType": "radio"},
                {"name": "hubspot_owner_assigneddate", "label": "Owner Assigned Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "lastmodifieddate", "label": "Last Modified Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "num_associated_deals", "label": "Associated Deals", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "recent_deal_amount", "label": "Recent Deal Amount", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "recent_deal_close_date", "label": "Recent Deal Close Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "total_revenue", "label": "Total Revenue", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "firstname", "label": "First Name", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "lastname", "label": "Last Name", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "salutation", "label": "Salutation", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "email", "label": "Email", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "mobilephone", "label": "Mobile Phone Number", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "phone", "label": "Phone Number", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "fax", "label": "Fax Number", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "address", "label": "Street Address", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "hubspot_owner_id", "label": "Contact owner", "groupName": "contactinformation", "type": "enumeration", "readOnlyValue": false, "fieldType": "select"},
                {"name": "notes_last_contacted", "label": "Last Contacted", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "notes_last_updated", "label": "Last Activity Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "notes_next_activity_date", "label": "Next Activity Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "num_contacted_notes", "label": "Number of times contacted", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "num_notes", "label": "Number of Sales Activities", "groupName": "contactinformation", "type": "number", "readOnlyValue": true, "fieldType": "number"},
                {"name": "city", "label": "City", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "state", "label": "State/Region", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "zip", "label": "Postal Code", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "country", "label": "Country/Region", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "jobtitle", "label": "Job Title", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "message", "label": "Message", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "textarea"},
                {"name": "closedate", "label": "Close Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": false, "fieldType": "date"},
                {"name": "hs_lifecyclestage_lead_date", "label": "Became a Lead Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lifecyclestage_marketingqualifiedlead_date", "label": "Became a Marketing Qualified Lead Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lifecyclestage_opportunity_date", "label": "Became an Opportunity Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "lifecyclestage", "label": "Lifecycle Stage", "groupName": "contactinformation", "type": "enumeration", "readOnlyValue": false, "fieldType": "radio"},
                {"name": "hs_lifecyclestage_salesqualifiedlead_date", "label": "Became a Sales Qualified Lead Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "createdate", "label": "Create Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lifecyclestage_evangelist_date", "label": "Became an Evangelist Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lifecyclestage_customer_date", "label": "Became a Customer Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "company", "label": "Company Name", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "hs_lifecyclestage_subscriber_date", "label": "Became a Subscriber Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "hs_lifecyclestage_other_date", "label": "Became an Other Lifecycle Date", "groupName": "contactinformation", "type": "datetime", "readOnlyValue": true, "fieldType": "date"},
                {"name": "website", "label": "Website URL", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "numemployees", "label": "Number of Employees", "groupName": "contactinformation", "type": "enumeration", "readOnlyValue": false, "fieldType": "select"},
                {"name": "annualrevenue", "label": "Annual Revenue", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "industry", "label": "Industry", "groupName": "contactinformation", "type": "string", "readOnlyValue": false, "fieldType": "text"},
                {"name": "associatedcompanyid", "label": "Associated Company ID", "groupName": "contactinformation", "type": "number", "readOnlyValue": false, "fieldType": "number"}
              ]
            }
          ]);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
            "properties": [
              {"property": "hs_lead_status", "value": "some value" },
              {"property": "firstname", "value": "some value" },
              {"property": "lastname", "value": "some value" },
              {"property": "salutation", "value": "some value" },
              {"property": "email", "value": "email@email.com" },
              {"property": "mobilephone", "value": "some value" },
              {"property": "phone", "value": "some value" },
              {"property": "fax", "value": "some value" },
              {"property": "address", "value": "some value" },
              {"property": "hubspot_owner_id", "value": "some value" },
              {"property": "city", "value": "some value" },
              {"property": "state", "value": "some value" },
              {"property": "zip", "value": "some value" },
              {"property": "country", "value": "some value" },
              {"property": "jobtitle", "value": "some value" },
              {"property": "message", "value": "some value" },
              {"property": "closedate", "value": "some value" },
              {"property": "lifecyclestage", "value": "some value" },
              {"property": "company", "value": "some value" },
              {"property": "website", "value": "some value" },
              {"property": "numemployees", "value": "some value" },
              {"property": "annualrevenue", "value": "some value" },
              {"property": "industry", "value": "some value" },
              {"property": "associatedcompanyid", "value": "some value" },
              {"property": "hull_segments", "value": "User Segment 1" }
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
          user: {
            email,
            "hubspot/id": "existingContactId",
            "hubspot/days_to_close": "some value",
            "hubspot/first_deal_created_at": "some value",
            "hubspot/lead_status": "some value",
            "hubspot/owner_assigned_at": "some value",
            "hubspot/updated_at": "some value",
            "hubspot/associated_deals_count": "some value",
            "hubspot/recent_deal_amount": "some value",
            "hubspot/recent_deal_closed_at": "some value",
            "hubspot/total_revenue": "some value",
            "hubspot/first_name": "some value",
            "hubspot/last_name": "some value",
            "hubspot/salutation": "some value",
            "hubspot/mobile_phone": "some value",
            "hubspot/phone": "some value",
            "hubspot/fax": "some value",
            "hubspot/address_street": "some value",
            "hubspot/hubspot_owner_id": "some value",
            "hubspot/notes_last_contacted_at": "some value",
            "hubspot/last_activity_at": "some value",
            "hubspot/next_activity_at": "some value",
            "hubspot/contacted_notes_count": "some value",
            "hubspot/notes_count": "some value",
            "hubspot/address_city": "some value",
            "hubspot/address_state": "some value",
            "hubspot/address_postal_code": "some value",
            "hubspot/address_country": "some value",
            "hubspot/job_title": "some value",
            "hubspot/message": "some value",
            "hubspot/closed_at": "some value",
            "hubspot/became_lead_at": "some value",
            "hubspot/became_marketing_qualified_lead_at": "some value",
            "hubspot/became_opportunity_at": "some value",
            "hubspot/lifecycle_stage": "some value",
            "hubspot/became_sales_qualified_lead_at": "some value",
            "hubspot/created_at": "some value",
            "hubspot/became_evangelist_at": "some value",
            "hubspot/became_customer_at": "some value",
            "hubspot/company": "some value",
            "hubspot/became_subscriber_at": "some value",
            "hubspot/became_other_at": "some value",
            "hubspot/website": "some value",
            "hubspot/employees_count": "some value",
            "hubspot/annual_revenue": "some value",
            "hubspot/industry": "some value",
            "hubspot/associatedcompanyid": "some value",
            "hubspot/opened_count": "some value",
            "hubspot/emails_bounced_count": "some value",
            "hubspot/email_optout": "some value"
          },
          segments: [{ id: "user_segment_1", name: "User Segment 1" }],
          changes: {
            is_new: false,
            user: {},
            account: {},
            segments: {
              left: [{ id: "5bffc38f625718d58b000004" }]
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
                { "property": "hs_lead_status", "value": "some value" },
                { "property": "firstname", "value": "some value" },
                { "property": "lastname", "value": "some value" },
                { "property": "salutation", "value": "some value" },
                { "property": "email", "value": "email@email.com" },
                { "property": "mobilephone", "value": "some value" },
                { "property": "phone", "value": "some value" },
                { "property": "fax", "value": "some value" },
                { "property": "address", "value": "some value" },
                { "property": "hubspot_owner_id", "value": "some value" },
                { "property": "city", "value": "some value" },
                { "property": "state", "value": "some value" },
                { "property": "zip", "value": "some value" },
                { "property": "country", "value": "some value" },
                { "property": "jobtitle", "value": "some value" },
                { "property": "message", "value": "some value" },
                { "property": "closedate", "value": "some value" },
                { "property": "lifecyclestage", "value": "some value" },
                { "property": "company", "value": "some value" },
                { "property": "website", "value": "some value" },
                { "property": "numemployees", "value": "some value" },
                { "property": "annualrevenue", "value": "some value" },
                { "property": "industry", "value": "some value" },
                { "property": "associatedcompanyid", "value": "some value" },
                { "property": "hull_segments", "value": "User Segment 1" }
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
