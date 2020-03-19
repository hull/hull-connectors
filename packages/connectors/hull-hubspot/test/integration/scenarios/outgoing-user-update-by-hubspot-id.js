// @flow

import connectorConfig from "../../../server/config";
const testScenario = require("hull-connector-framework/src/test-scenario");
const contactPropertyGroups = require("../fixtures/get-contacts-groups");

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "abc";

const connector = {
  private_settings: {
    token: "hubToken",
    synchronized_user_segments: ["user_segment_1"],
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
          .reply(200, contactPropertyGroups);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.post("/contacts/v1/contact/batch/?auditId=Hull", [{
            "properties": [
              {"property":"city","value":"some value"},
              {"property":"country","value":"some value"},
              {"property":"zip","value":"some value"},
              {"property":"state","value":"some value"},
              {"property":"address","value":"some value"},
              {"property":"annualrevenue","value":"some value"},
              {"property":"associatedcompanyid","value":"some value"},
              {"property":"closedate","value":"some value"},
              {"property":"company","value":"some value"},
              {"property":"numemployees","value":"some value"},
              {"property":"fax","value":"some value"},
              {"property":"firstname","value":"some value"},
              {"property":"hubspot_owner_id","value":"some value"},
              {"property":"industry","value":"some value"},
              {"property":"jobtitle","value":"some value"},
              {"property":"lastname","value":"some value"},
              {"property":"hs_lead_status","value":"some value"},
              {"property":"lifecyclestage","value":"some value"},
              {"property":"message","value":"some value"},
              {"property":"mobilephone","value":"some value"},
              {"property":"phone","value":"some value"},
              {"property":"salutation","value":"some value"},
              {"property":"website","value":"some value"},
              {"property":"hull_segments","value":"User Segment 1"}
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
                {"property":"city","value":"some value"},
                {"property":"country","value":"some value"},
                {"property":"zip","value":"some value"},
                {"property":"state","value":"some value"},
                {"property":"address","value":"some value"},
                {"property":"annualrevenue","value":"some value"},
                {"property":"associatedcompanyid","value":"some value"},
                {"property":"closedate","value":"some value"},
                {"property":"company","value":"some value"},
                {"property":"numemployees","value":"some value"},
                {"property":"fax","value":"some value"},
                {"property":"firstname","value":"some value"},
                {"property":"hubspot_owner_id","value":"some value"},
                {"property":"industry","value":"some value"},
                {"property":"jobtitle","value":"some value"},
                {"property":"lastname","value":"some value"},
                {"property":"hs_lead_status","value":"some value"},
                {"property":"lifecyclestage","value":"some value"},
                {"property":"message","value":"some value"},
                {"property":"mobilephone","value":"some value"},
                {"property":"phone","value":"some value"},
                {"property":"salutation","value":"some value"},
                {"property":"website","value":"some value"},
                {"property":"hull_segments","value":"User Segment 1"}
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
