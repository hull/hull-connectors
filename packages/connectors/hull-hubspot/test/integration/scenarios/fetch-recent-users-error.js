// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const contactPropertyGroups = require("../fixtures/get-contacts-groups");
import connectorConfig from "../../../server/config";

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = 1;
process.env.CLIENT_SECRET = 1;

const connector = {
  private_settings: {
    token: "hubToken",
    last_fetch_at: 1419967066626,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("Fetch recent contacts should fail on incorrect permissions error", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-contacts",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, contactPropertyGroups);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?property=email&property=annualrevenue&property=associatedcompanyid&property=num_associated_deals&property=hs_lifecyclestage_customer_date&property=hs_lifecyclestage_lead_date&property=hs_lifecyclestage_marketingqualifiedlead_date&property=hs_lifecyclestage_salesqualifiedlead_date&property=hs_lifecyclestage_subscriber_date&property=hs_lifecyclestage_evangelist_date&property=hs_lifecyclestage_opportunity_date&property=hs_lifecyclestage_other_date&property=city&property=closedate&property=company&property=hubspot_owner_id&property=country&property=createdate&property=days_to_close&property=fax&property=first_deal_created_date&property=firstname&property=industry&property=jobtitle&property=notes_last_updated&property=notes_last_contacted&property=lastmodifieddate&property=lastname&property=hs_lead_status&property=lifecyclestage&property=hs_email_bounce&property=hs_email_open&property=message&property=mobilephone&property=notes_next_activity_date&property=numemployees&property=num_notes&property=num_contacted_notes&property=hubspot_owner_assigneddate&property=phone&property=zip&property=recent_deal_amount&property=recent_deal_close_date&property=salutation&property=state&property=address&property=total_revenue&property=hs_email_optout&property=website&property=email&count=100")
          .reply(400, {
            "status": "error",
            "message": "Unknown Contacts Search API failure: [400] {\"status\":\"error\",\"message\":\"User 12345 does not have permissions on portal 67890\",\"correlationId\":\"58059842-a984-4765-b31c-d92f39ea8407\"}",
            "correlationId": "58059842-a984-4765-b31c-d92f39ea8407"
          });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        ["info","incoming.job.start",{},{"jobName":"Incoming Data","type":"webpayload"}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/contacts/v2/groups","status":200,"vars":{}}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/properties/v1/companies/groups","status":200,"vars":{}}],
        ["debug","connector.service_api.call",{},{"responseTime":expect.whatever(),"method":"GET","url":"/contacts/v1/lists/recently_updated/contacts/recent","status":400,"vars":{}}],
        ["error","incoming.job.error",{},
          {
            "error": "Unknown Contacts Search API failure: [400] {\"status\":\"error\",\"message\":\"User 12345 does not have permissions on portal 67890\",\"correlationId\":\"58059842-a984-4765-b31c-d92f39ea8407\"}",
           "jobName":"Incoming Data","type":"webpayload"
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
        ["increment","service.service_api.errors",1],
        ["increment","connector.transient_error",1]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}]
      ]
    };
  });
});
