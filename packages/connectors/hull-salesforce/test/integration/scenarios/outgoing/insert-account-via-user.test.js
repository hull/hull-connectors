// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const createSoapEnvelope = require("../../../helper/soapapiopsresponse");
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
  access_token: "1",
  refresh_token: "1",
  fetch_resource_schema: false,
  fetch_accounts: false,
  ignore_users_withoutemail: false,
  ignore_users_withoutchanges: false,
  fetch_tasks: false,
  send_outgoing_tasks: false,
  lead_assignmentrule: "none",
  lead_assignmentrule_update: "none",
  lead_attributes_outbound: [],
  contact_attributes_outbound: [],
  account_attributes_outbound: [],
  lead_attributes_inbound: [],
  contact_attributes_inbound: [],
  account_attributes_inbound: [],
  events_mapping: [],
  task_references_outbound: [],
  task_attributes_outbound: [],
  lead_synchronized_segments: [],
  contact_synchronized_segments: [],
  account_synchronized_segments: [],
  user_claims: [
    { "hull": "email", "service": "Email" }
  ],
  lead_claims: [
    { "hull": "email", "service": "Email" }
  ]
}

describe("Insert Accounts Via User Update Tests", () => {

  it("should insert a new account via user update", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        "lead_synchronized_segments": [],
        "contact_synchronized_segments": [
          "59f09bc7f9c5a94af600076d"
        ],
        "account_synchronized_segments": [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        "lead_attributes_outbound": [
          {
            "hull": "first_name",
            "service": "FirstName",
            "overwrite": false
          },
          {
            "hull": "last_name",
            "service": "LastName",
            "overwrite": false
          },
          {
            "hull": "email",
            "service": "Email",
            "overwrite": false
          }
        ],
        "contact_attributes_outbound": [
          {
            "hull": "first_name",
            "service": "FirstName",
            "overwrite": false
          },
          {
            "hull": "last_name",
            "service": "LastName",
            "overwrite": false
          },
          {
            "hull": "email",
            "service": "Email",
            "overwrite": false
          }
        ],
        "account_claims": [
          {
            "hull": "domain",
            "service": "Website",
            "required": true
          },
          {
            "hull": "external_id",
            "service": "CustomIdentifierField",
            "required": true
          }
        ],
        "account_attributes_outbound": [
          {
            "hull": "domain",
            "service": "Website",
            "overwrite": false
          },
          {
            "hull": "name",
            "service": "Name",
            "overwrite": false
          },
          {
            "hull": "mrr",
            "service": "Mrr__c",
            "overwrite": true
          },
          {
            "hull": "cs_stage",
            "service": "CS_Stage__c",
            "overwrite": true
          }
        ],
        "lead_attributes_inbound": [
          {
            "service": "FirstName",
            "hull": "traits_salesforce_lead/first_name",
            "overwrite": false
          },
          {
            "service": "LastName",
            "hull": "traits_salesforce_lead/last_name",
            "overwrite": false
          },
          {
            "service": "Company",
            "hull": "traits_salesforce_lead/company",
            "overwrite": false
          },
          {
            "service": "Email",
            "hull": "traits_salesforce_lead/email",
            "overwrite": false
          },
          {
            "service": "Website",
            "hull": "traits_salesforce_lead/website",
            "overwrite": false
          }
        ],
        "contact_attributes_inbound": [
          {
            "hull": "traits_salesforce_contact/first_name",
            "service": "FirstName",
            "overwrite": false
          },
          {
            "hull": "traits_salesforce_contact/last_name",
            "service": "LastName",
            "overwrite": false
          },
          {
            "hull": "traits_salesforce_contact/email",
            "service": "Email",
            "overwrite": false
          }
        ],
        "account_attributes_inbound": [
          {
            "hull": "salesforce/website",
            "service": "Website",
            "overwrite": true
          },
          {
            "hull": "salesforce/name",
            "service": "Name",
            "overwrite": true
          },
          {
            "hull": "salesforce/mrr",
            "service": "Mrr__c",
            "overwrite": true
          }
        ]
      }
    };
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.notificationHandler,
        handlerUrl: "smart-notifier",
        channel: "user:update",
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Lead");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Account");
            })
            .reply(200, { records: [], done: true }, { "sforce-limit-info": "api-usage=500/50000" });

          const respBodyC1 = createSoapEnvelope("createResponse", { result: [{ id: "00Q1I000004WO7uUAG", success: "true" }, { id: "0031I000004SLT3QAO", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Contact</type><Email>adam.pietrzyk@krakowtraders.pl</Email><FirstName>Adam</FirstName><LastName>Pietrzyk</LastName>") !== -1;
            })
            .reply(200, respBodyC1, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });

          const respBody = createSoapEnvelope("createResponse", { result: [{ id: "0011I000007Cy18QAC", success: "true" }] });
          nock("https://na98.salesforce.com")
            .post("/services/Soap/u/39.0", (body) => {
              return body.indexOf("<create><sObjects><type>Account</type>") !== -1;
            })
            .reply(200, respBody, { "Content-Type": "text/xml", "sforce-limit-info": "api-usage=500/50000" });


          return scope;
        },
        connector,
        messages: [
          {
            "message_id": "UserUpdateAccountMessage1",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "salesforce:00Q1I000004WHchUAG"
              ],
              "created_at": "2017-12-27T16:46:48Z",
              "domain": "krakowtraders.pl",
              "email": "adam.pietrzyk@krakowtraders.pl",
              "first_name": "Adam",
              "has_password": false,
              "id": "5a43ce781f6d9f471d005d44",
              "is_approved": false,
              "last_name": "Pietrzyk",
              "name": "Adam Pietrzyk",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "traits_coconuts": 38,
              "indexed_at": "2017-12-27T18:15:54+00:00"
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days",
                "type": "users_segment",
                "created_at": "2017-10-25T14:12:23Z",
                "updated_at": "2017-10-25T14:12:23Z"
              }
            ],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "external_id": "0011I000007Cy18QAC"
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {
                "traits_coconuts": [
                  null,
                  38
                ]
              },
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          },
          {
            "message_id": "UserUpdateAccountMessage2",
            "user": {
              "accepts_marketing": false,
              "anonymous_ids": [
                "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
              ],
              "created_at": "2017-09-25T21:32:07Z",
              "domain": "krakowtraders.pl",
              "email": "rafa.kasczka@krakowtraders.pl",
              "first_name": "Rafa",
              "first_seen_at": "2017-09-25T21:32:07Z",
              "first_session_initial_referrer": "https://dashboard.hullapp.io/12345/ships/abcda/customize",
              "first_session_initial_url": "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
              "first_session_platform_id": "59c975cd2c8lahfsgn96b5cb8001f3a",
              "first_session_started_at": "2017-09-25T21:32:07Z",
              "has_password": false,
              "id": "59c975d75226a8c3a6001f40",
              "is_approved": false,
              "last_known_ip": "8.8.8.8",
              "last_name": "Kasczka",
              "last_seen_at": "2017-12-27T18:13:01Z",
              "latest_session_initial_referrer": "https://dashboard.hullapp.io/12345/ships/abcda/customize",
              "latest_session_initial_url": "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
              "latest_session_platform_id": "59cd3c9aflhga35e5f52b14a000944",
              "latest_session_started_at": "2017-12-27T18:13:01Z",
              "segment_ids": [
                "59f09bc7f9c5a94af600076d"
              ],
              "signup_session_initial_referrer": "https://dashboard.hullapp.io/12345/ships/abcda/customize",
              "signup_session_initial_url": "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
              "signup_session_platform_id": "59c975cd2c8lahfsgn96b5cb8001f3a",
              "signup_session_started_at": "2017-09-25T21:32:07Z",
              "traits_cio_testing/coconuts": 12,
              "traits_cio_testing/processed_at": "2017-10-17T15:50:57+00:00",
              "traits_cio_testing/send_spam": true,
              "traits_cio_testing/techstack": [
                "SAP CRM",
                "Microsoft Office 365",
                "Google Cloud",
                "Salesforce",
                "Oracle"
              ],
              "traits_pardottesting/demo_requested": "2017-10-06T12:17:12+00:00",
              "traits_pardottesting/email_optout": true,
              "traits_pardottesting/frankenstack": "Yes",
              "traits_pardottesting/last_update": "2017-10-06T11:22:28.267Z",
              "traits_pardottesting/market": "B2B",
              "traits_pardottesting/ready_for_sync": true,
              "traits_pardottesting/tech_stack": [
                "Clearbit",
                "Datanyze",
                "Segment",
                "Oracle",
                "SAP"
              ],
              "traits_pardottesting/use_case": "Spicy jalapeno bacon ipsum dolor amet landjaeger flank fatback tongue ground round shankle pork belly, frankfurter tenderloin filet mignon cupim. Jerky rump burgdoggen jowl ribeye short loin ground round shank cow meatloaf kevin. Shank drumstick jowl filet mignon t-bone turkey flank meatball cow pork belly prosciutto kielbasa. Shoulder biltong cow, hamburger tenderloin kevin turducken tri-tip swine chicken tongue andouille. Pork ball tip burgdoggen bacon andouille beef sausage turkey doner. Jerky meatball venison tail pork loin pork belly beef capicola, ribeye salami.",
              "traits_pardottesting/visits_pricingpage": 18,
              "traits_recomputef": "2017-10-02T09:49:39.790Z",
              "traits_testdif/nonesense_at": "2011-10-17T18:00:04+00:00",
              "traits_testdif/nonesensecount": 4,
              "traits_testing_coconuts": 12,
              "traits_testing_date": "2017-10-10T10:10:10+00:00",
              "traits_testing_string": 123,
              "traits_testsup150": true,
              "traits_coconuts": 48,
              "traits_company": "Krakow Traders",
              "indexed_at": "2017-12-27T18:15:54+00:00"
            },
            "segments": [
              {
                "id": "59f09bc7f9c5a94af600076d",
                "name": "Users signed in last 100 days",
                "type": "users_segment",
                "created_at": "2017-10-25T14:12:23Z",
                "updated_at": "2017-10-25T14:12:23Z"
              }
            ],
            "account": {
              "created_at": "2017-10-25T10:06:00Z",
              "domain": "krakowtraders.pl",
              "employees": 2,
              "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "industry": "Technology",
              "name": "Krakow Traders",
              "plan": "Enterprise",
              "mrr": 950,
              "_sales_business_won": "2017-10-25T12:45:00Z",
              "cs_stage": "Pending",
              "external_id": "0011I000007Cy18QAC"
            },
            "account_segments": [
              {
                "id": "accountSegmentId1",
                "name": "accountSegment1",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              },
              {
                "id": "accountSegmentId3",
                "name": "accountSegment3",
                "updated_at": "2019-04-30T22:00:24Z",
                "type": "accounts_segment",
                "created_at": "2019-04-30T22:00:24Z"
              }
            ],
            "events": [],
            "changes": {
              "user": {
                "traits_coconuts": [
                  null,
                  45
                ]
              },
              "segments": {},
              "account": {},
              "account_segments": {},
              "is_new": false
            }
          }
        ],
        response: { "flow_control": { "type": "next", } },
        logs: [
          ["info", "outgoing.job.start", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }],
          [
            "debug",
            "ship.service_api.request",
            {
              "request_id": expect.whatever()
            },
            {
              "method": "GET",
              "url_length": 343,
              "url": expect.stringMatching(/.*FROM.*Lead.*/)
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {
              "request_id": expect.whatever()
            },
            {
              "method": "GET",
              "url_length": 287,
              "url": expect.stringMatching(/.*FROM.*Contact.*/)
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {
              "request_id": expect.whatever()
            },
            {
              "method": "GET",
              "url_length": 323,
              "url": expect.stringMatching(/.*FROM.*Account.*/)
            }
          ],
          [
            "info",
            "outgoing.account.success",
            {
              "subject_type": "account",
              "request_id": expect.whatever(),
              "account_id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
              "account_external_id": "0011I000007Cy18QAC",
              "account_domain": "krakowtraders.pl",
              "account_anonymous_id": "salesforce:0011I000007Cy18QAC"
            },
            {
              "record": {
                "Website": "krakowtraders.pl",
                "Name": "Krakow Traders",
                "Mrr__c": 950,
                "CS_Stage__c": "Pending",
                "CustomIdentifierField": "0011I000007Cy18QAC",
                "Id": "0011I000007Cy18QAC"
              },
              "operation": "insert",
              "resource": "Account"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "5a43ce781f6d9f471d005d44",
              "user_email": "adam.pietrzyk@krakowtraders.pl",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WO7uUAG"
            },
            {
              "record": {
                "FirstName": "Adam",
                "LastName": "Pietrzyk",
                "Email": "adam.pietrzyk@krakowtraders.pl",
                "AccountId": "0011I000007Cy18QAC",
                "Id": "00Q1I000004WO7uUAG"
              },
              "operation": "insert",
              "resource": "Contact"
            }
          ],
          [
            "info",
            "outgoing.user.success",
            {
              "subject_type": "user",
              "request_id": expect.whatever(),
              "user_id": "59c975d75226a8c3a6001f40",
              "user_email": "rafa.kasczka@krakowtraders.pl",
              "user_anonymous_id": "salesforce-contact:0031I000004SLT3QAO"
            },
            {
              "record": {
                "FirstName": "Rafa",
                "LastName": "Kasczka",
                "Email": "rafa.kasczka@krakowtraders.pl",
                "AccountId": "0011I000007Cy18QAC",
                "Id": "0031I000004SLT3QAO"
              },
              "operation": "insert",
              "resource": "Contact"
            }
          ],
          ["info", "outgoing.job.success", { "request_id": expect.whatever() }, { "jobName": "Outgoing Data", "type": "webpayload" }]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asAccount": {
                "id": "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                "external_id": "0011I000007Cy18QAC",
                "domain": "krakowtraders.pl",
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/website": {
                "value": "krakowtraders.pl",
                "operation": "set"
              },
              "name": {
                "value": "Krakow Traders",
                "operation": "setIfNull"
              },
              "salesforce/name": {
                "value": "Krakow Traders",
                "operation": "set"
              },
              "salesforce/mrr": {
                "value": 950,
                "operation": "set"
              },
              "salesforce/id": {
                "value": "0011I000007Cy18QAC",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "id": "5a43ce781f6d9f471d005d44",
                "email": "adam.pietrzyk@krakowtraders.pl",
                "anonymous_id": "salesforce-contact:00Q1I000004WO7uUAG"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Adam",
                "operation": "setIfNull"
              },
              "salesforce_contact/first_name": {
                "value": "Adam",
                "operation": "set"
              },
              "last_name": {
                "value": "Pietrzyk",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "Pietrzyk",
                "operation": "set"
              },
              "salesforce_contact/email": {
                "value": "adam.pietrzyk@krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "00Q1I000004WO7uUAG",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "id": "59c975d75226a8c3a6001f40",
                "email": "rafa.kasczka@krakowtraders.pl",
                "anonymous_id": "salesforce-contact:0031I000004SLT3QAO"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Rafa",
                "operation": "setIfNull"
              },
              "salesforce_contact/first_name": {
                "value": "Rafa",
                "operation": "set"
              },
              "last_name": {
                "value": "Kasczka",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "Kasczka",
                "operation": "set"
              },
              "salesforce_contact/email": {
                "value": "rafa.kasczka@krakowtraders.pl",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "0031I000004SLT3QAO",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics:[
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["increment","ship.service_api.call",1]
        ],
        platformApiCalls: []
      };
    });
  });
});
