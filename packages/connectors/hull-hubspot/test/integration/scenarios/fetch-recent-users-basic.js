// @flow

const testScenario = require("hull-connector-framework/src/test-scenario");
const _ = require("lodash");
const contactPropertyGroups = require("../fixtures/get-contacts-groups");
import connectorConfig from "../../../server/config";

process.env.OVERRIDE_HUBSPOT_URL = "";
process.env.CLIENT_ID = 1;
process.env.CLIENT_SECRET = 1;

const incomingData = require("../fixtures/get-contacts-recently-updated");

const connector = {
  private_settings: {
    token: "hubToken",
    last_fetch_at: 1419967066626,
    mark_deleted_contacts: false,
    mark_deleted_companies: false
  }
};

it("should fetch recent users using settings", () => {
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
          .reply(200, incomingData);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?vidOffset=3714024&timeOffset=1484854580823&property=email&property=annualrevenue&property=associatedcompanyid&property=num_associated_deals&property=hs_lifecyclestage_customer_date&property=hs_lifecyclestage_lead_date&property=hs_lifecyclestage_marketingqualifiedlead_date&property=hs_lifecyclestage_salesqualifiedlead_date&property=hs_lifecyclestage_subscriber_date&property=hs_lifecyclestage_evangelist_date&property=hs_lifecyclestage_opportunity_date&property=hs_lifecyclestage_other_date&property=city&property=closedate&property=company&property=hubspot_owner_id&property=country&property=createdate&property=days_to_close&property=fax&property=first_deal_created_date&property=firstname&property=industry&property=jobtitle&property=notes_last_updated&property=notes_last_contacted&property=lastmodifieddate&property=lastname&property=hs_lead_status&property=lifecyclestage&property=hs_email_bounce&property=hs_email_open&property=message&property=mobilephone&property=notes_next_activity_date&property=numemployees&property=num_notes&property=num_contacted_notes&property=hubspot_owner_assigneddate&property=phone&property=zip&property=recent_deal_amount&property=recent_deal_close_date&property=salutation&property=state&property=address&property=total_revenue&property=hs_email_optout&property=website&property=email&count=100")
          .reply(200, { contacts: [], "has-more": false, "time-offset": 0 });
        return scope;
      },
      connector,
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        ["info", "incoming.job.start", expect.whatever(), {jobName: "Incoming Data", type: "webpayload"}],
        ["debug", "connector.service_api.call", expect.whatever(),
          expect.objectContaining({
            method: "GET",
            status: 200,
            url: "/contacts/v2/groups",
          })
        ],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/properties/v1/companies/groups" })],
        ["debug", "connector.service_api.call", expect.whatever(), expect.objectContaining({ "method": "GET", "status": 200, "url": "/contacts/v1/lists/recently_updated/contacts/recent" })],
        ["debug", "saveContacts", {}, 2],
        ["debug", "incoming.user", {},
          {
            "claims": {
              "email": "testingapis@hubspot.com",
              "anonymous_id": "hubspot:3234574"
            },
            "traits": {
              "hubspot/id": 3234574,
              "hubspot/company": "HubSpot",
              "hubspot/first_name": "Jeff",
              "hubspot/updated_at": "1484858431084",
              "hubspot/last_name": "Testing",
              "first_name": {
                "operation": "setIfNull",
                "value": "Jeff"
              },
              "last_name": {
                "operation": "setIfNull",
                "value": "Testing"
              }
            }
          }
        ],
        ["debug", "incoming.account.link.skip",
          { subject_type: "user", user_email: "testingapis@hubspot.com", user_anonymous_id: "hubspot:3234574" },
          { reason: "incoming linking is disabled, you can enabled it in the settings" }
        ],
        ["debug", "incoming.user", {},
          {
            "claims": {
              "email": "new-email@hubspot.com",
              "anonymous_id": "hubspot:3714024"
            },
            "traits": {
              "hubspot/id": 3714024,
              "hubspot/first_name": "Updated",
              "hubspot/updated_at": "1484854580823",
              "hubspot/last_name": "Record",
              "first_name": {
                "operation": "setIfNull",
                "value": "Updated"
              },
              "last_name": {
                "operation": "setIfNull",
                "value": "Record"
              }
            }
          }
        ],
        ["debug", "incoming.account.link.skip",
          { subject_type: "user", user_anonymous_id: "hubspot:3714024", user_email: "new-email@hubspot.com", },
          { reason: "incoming linking is disabled, you can enabled it in the settings" }
        ],
        ["debug", "incoming.user.success",
          { subject_type: "user", user_anonymous_id: "hubspot:3234574", user_email: "testingapis@hubspot.com", },
          {
            traits: {
              "hubspot/id": 3234574,
              "hubspot/company": "HubSpot",
              "hubspot/first_name": "Jeff",
              "hubspot/updated_at": "1484858431084",
              "hubspot/last_name": "Testing",
              "first_name": {
                "operation": "setIfNull",
                "value": "Jeff"
              },
              "last_name": {
                "operation": "setIfNull",
                "value": "Testing"
              }
            }
          }
        ],
        ["debug", "incoming.user.success",
          { subject_type: "user", user_anonymous_id: "hubspot:3714024", user_email: "new-email@hubspot.com", },
          {
            "traits": {
              "hubspot/id": 3714024,
              "hubspot/first_name": "Updated",
              "hubspot/updated_at": "1484854580823",
              "hubspot/last_name": "Record",
              "first_name": {
                "operation": "setIfNull",
                "value": "Updated"
              },
              "last_name": {
                "operation": "setIfNull",
                "value": "Record"
              }
            }
          }
        ],
        ["debug", "connector.service_api.call", {}, expect.objectContaining({ method: "GET", status: 200, url: "/contacts/v1/lists/recently_updated/contacts/recent" })],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["traits",
          { "asUser": { "email": "testingapis@hubspot.com", "anonymous_id": "hubspot:3234574" }, "subjectType": "user" },
          {
            "hubspot/id": 3234574,
            "hubspot/company": "HubSpot",
            "hubspot/first_name": "Jeff",
            "hubspot/updated_at": "1484858431084",
            "hubspot/last_name": "Testing",
            "first_name": {
              "operation": "setIfNull",
              "value": "Jeff"
            },
            "last_name": {
              "operation": "setIfNull",
              "value": "Testing"
            }
          }
        ],
        ["traits",
          {
            "asUser": {
              "email": "new-email@hubspot.com",
              "anonymous_id": "hubspot:3714024"
            },
            "subjectType": "user"
          },
          {
            "hubspot/id": 3714024,
            "hubspot/first_name": "Updated",
            "hubspot/updated_at": "1484854580823",
            "hubspot/last_name": "Record",
            "first_name": {
              "operation": "setIfNull",
              "value": "Updated"
            },
            "last_name": {
              "operation": "setIfNull",
              "value": "Record"
            }
          }
        ]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
        ["increment", "ship.incoming.users", 2],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.any(Number)],
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})]
      ]
    };
  });
});

it("Should Fetch Contact With Mapped Incoming Attributes", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-contacts",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, [
            {
              "name": "contactinformation",
              "displayName": "Contact Information",
              "properties": [
                {
                  "name": "job_function",
                  "label": "Job function",
                  "groupName": "contactinformation",
                  "type": "string",
                  "fieldType": "text",
                  "formField": true,
                  "readOnlyValue": false
                }
              ]
            },
            {
              "name": "hull",
              "displayName": "Hull Properties",
              "properties": [
                {
                  "name": "hull_segments",
                  "label": "Hull Segments",
                  "groupName": "hull",
                  "type": "enumeration",
                  "fieldType": "checkbox",
                  "hidden": false,
                  "readOnlyValue": false,
                  "options": [
                    {
                      "readOnly": false,
                      "label": "HubspotUsers",
                      "hidden": false,
                      "value": "HubspotUsers",
                    }
                  ]
                }
              ]
            }
          ]);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?property=job_function&property=email&count=100")
          .reply(200, {
              "contacts": [
                {
                  "vid": 1,
                  "canonical-vid": 1,
                  "merged-vids": [
                    1,
                    51
                  ],
                  "portal-id": 6925922,
                  "properties": {
                    "email": {
                      "value": "coolrobot@hubspot.com"
                    },
                    "job_function": {
                      "value": "a value"
                    }
                  }
                }
              ],
              "has-more": true,
              "vid-offset": 3714024,
              "time-offset": 1484854580823
            }
          );
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?vidOffset=3714024&timeOffset=1484854580823&property=job_function&property=email&count=100")
          .reply(200, { contacts: [], "has-more": false, "time-offset": 0 });
        return scope;
      },
      connector: {
        private_settings: {
          token: "hubToken",
          last_fetch_at: 1419967066626,
          mark_deleted_contacts: false,
          mark_deleted_companies: false,
          incoming_user_attributes: [
            {
              service: '$.properties.job_function.value',
              hull: 'traits_hubspot/job_function',
              overwrite: false
            },
            {
              service: '$.`merged-vids`',
              hull: 'traits_hubspot/merged_vids',
              overwrite: true
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      response: {"status": "deferred"},
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/contacts/v2/groups", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/properties/v1/companies/groups", "status": 200, "vars": {} }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/contacts/v1/lists/recently_updated/contacts/recent", "status": 200, "vars": {}}],
        ["debug", "saveContacts", {}, 1],
        ["debug", "incoming.user", {}, { "claims": { "email": "coolrobot@hubspot.com", "anonymous_id": "hubspot:1" }, "traits": { "hubspot/job_function": { "operation": "setIfNull", "value": "a value" }, "hubspot/merged_vids": [1, 51], "hubspot/id": 1 } }],
        ["debug", "incoming.account.link.skip", { "subject_type": "user", "user_email": "coolrobot@hubspot.com", "user_anonymous_id": "hubspot:1" }, { "reason": "incoming linking is disabled, you can enabled it in the settings" }],
        ["debug", "incoming.user.success", { "subject_type": "user", "user_email": "coolrobot@hubspot.com", "user_anonymous_id": "hubspot:1" }, { "traits": { "hubspot/job_function": { "operation": "setIfNull", "value": "a value" }, "hubspot/merged_vids": [1, 51], "hubspot/id": 1 } }],
        ["debug", "connector.service_api.call", {}, { "responseTime": expect.whatever(), "method": "GET", "url": "/contacts/v1/lists/recently_updated/contacts/recent", "status": 200, "vars": {} }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["alias", { "asUser": { "email": "coolrobot@hubspot.com", "anonymous_id": "hubspot:1" }, "subjectType": "user" }, { "anonymous_id": "hubspot:1" }],
        ["alias", { "asUser": { "email": "coolrobot@hubspot.com", "anonymous_id": "hubspot:1" }, "subjectType": "user" }, { "anonymous_id": "hubspot:51" }],
        ["traits", { "asUser": { "email": "coolrobot@hubspot.com", "anonymous_id": "hubspot:1" }, "subjectType": "user" }, { "hubspot/job_function": { "operation": "setIfNull", "value": "a value" }, "hubspot/merged_vids": [1, 51], "hubspot/id": 1 }]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.service_api.call", 1], ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})]
      ]
    };
  });
});

it("Should Fetch Contact With Missing Optional Claims", () => {
  return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
    return {
      handlerType: handlers.scheduleHandler,
      handlerUrl: "fetch-recent-contacts",
      externalApiMock: () => {
        const scope = nock("https://api.hubapi.com");
        scope.get("/contacts/v2/groups?includeProperties=true")
          .reply(200, [
            {
              "name": "contactinformation",
              "displayName": "Contact Information",
              "properties": [
                {
                  "name": "job_function",
                  "label": "Job function",
                  "groupName": "contactinformation",
                  "type": "string",
                  "fieldType": "text",
                  "formField": true,
                  "readOnlyValue": false
                }
              ]
            }
          ]);
        scope.get("/properties/v1/companies/groups?includeProperties=true")
          .reply(200, []);
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?property=job_function&property=email&count=100")
          .reply(200, {
              "contacts": [
                {
                  "vid": 1,
                  "portal-id": 6925922,
                  "properties": {
                    "job_function": {
                      "value": "a value"
                    }
                  }
                }
              ],
              "has-more": true,
              "vid-offset": 3714024,
              "time-offset": 1484854580823
            }
          );
        scope.get("/contacts/v1/lists/recently_updated/contacts/recent?vidOffset=3714024&timeOffset=1484854580823&property=job_function&property=email&count=100")
          .reply(200, { contacts: [], "has-more": false, "time-offset": 0 });
        return scope;
      },
      connector: {
        private_settings: {
          token: "hubToken",
          last_fetch_at: 1419967066626,
          mark_deleted_contacts: false,
          mark_deleted_companies: false,
          incoming_user_claims: [
            {
              hull: 'email',
              service: 'properties.email.value',
              required: false
            }
          ],
          incoming_user_attributes: [
            {
              service: '$.properties.job_function.value',
              hull: 'traits_hubspot/job_function',
              overwrite: true
            }
          ]
        }
      },
      usersSegments: [],
      accountsSegments: [],
      response: { "status": "deferred" },
      logs: [
        ["info", "incoming.job.start", {}, { "jobName": "Incoming Data", "type": "webpayload" }],
        ["debug", "connector.service_api.call", {}, {
          "responseTime": expect.whatever(),
          "method": "GET",
          "url": "/contacts/v2/groups",
          "status": 200,
          "vars": {}
        }],
        ["debug", "connector.service_api.call", {}, {
          "responseTime": expect.whatever(),
          "method": "GET",
          "url": "/properties/v1/companies/groups",
          "status": 200,
          "vars": {}
        }],
        ["debug", "connector.service_api.call", {}, {
          "responseTime": expect.whatever(),
          "method": "GET",
          "url": "/contacts/v1/lists/recently_updated/contacts/recent",
          "status": 200,
          "vars": {}
        }],
        ["debug", "saveContacts", {}, 1],
        ["debug", "incoming.user", {}, {
          "claims": { "anonymous_id": "hubspot:1" },
          "traits": { "hubspot/job_function": "a value", "hubspot/id": 1 }
        }],
        ["debug", "incoming.account.link.skip", {
          "subject_type": "user",
          "user_anonymous_id": "hubspot:1"
        }, { "reason": "incoming linking is disabled, you can enabled it in the settings" }],
        ["debug", "incoming.user.success", {
          "subject_type": "user",
          "user_anonymous_id": "hubspot:1"
        }, { "traits": { "hubspot/job_function": "a value", "hubspot/id": 1 } }],
        ["debug", "connector.service_api.call", {}, {
          "responseTime": expect.whatever(),
          "method": "GET",
          "url": "/contacts/v1/lists/recently_updated/contacts/recent",
          "status": 200,
          "vars": {}
        }],
        ["info", "incoming.job.success", {}, { "jobName": "Incoming Data", "type": "webpayload" }]
      ],
      firehoseEvents: [
        ["traits", {
          "asUser": { "anonymous_id": "hubspot:1" },
          "subjectType": "user"
        }, { "hubspot/job_function": "a value", "hubspot/id": 1 }]
      ],
      metrics: [
        ["increment", "connector.request", 1],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.service_api.call", 1],
        ["value", "connector.service_api.response_time", expect.whatever()],
        ["increment", "ship.incoming.users", 1],
        ["increment", "ship.service_api.call", 1], ["value", "connector.service_api.response_time", expect.whatever()]
      ],
      platformApiCalls: [
        ["GET", "/api/v1/search/user_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/search/account_reports/bootstrap", {}, {}],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})],
        ["GET", "/api/v1/app", {}, {}],
        ["PUT", "/api/v1/9993743b22d60dd829001999", {}, expect.objectContaining({"private_settings": expect.whatever()})]
      ]
    };
  });
});
