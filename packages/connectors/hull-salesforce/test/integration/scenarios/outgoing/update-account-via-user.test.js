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
  account_synchronized_segments: []
};

describe("Update Accounts Via User Update Tests", () => {
  it("should update an account, via the user, that has not been synced in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        source: "salesforce_main",
        contact_synchronized_segments: ["59f09bc7f9c5a94af600076d"],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        lead_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: false
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        lead_attributes_inbound: [
          {
            service: "FirstName",
            hull: "traits_salesforce_lead/first_name",
            overwrite: false
          },
          {
            service: "LastName",
            hull: "traits_salesforce_lead/last_name",
            overwrite: false
          },
          {
            service: "Company",
            hull: "traits_salesforce_lead/company",
            overwrite: false
          },
          {
            service: "Email",
            hull: "traits_salesforce_lead/email",
            overwrite: false
          },
          {
            service: "Website",
            hull: "traits_salesforce_lead/website",
            overwrite: false
          }
        ],
        contact_attributes_inbound: [
          {
            hull: "traits_salesforce_contact/first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/email",
            service: "Email",
            overwrite: false
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Contact");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/00Q1I000004WO7uUAG"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "adam.pietrzyk@krakowtraders.pl",
                      FirstName: "Adam",
                      Id: "00Q1I000004WO7uUAG",
                      LastName: "Pietrzyk"
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/0031I000004SLT3QAO"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "rafa.kasczka@krakowtraders.pl",
                      FirstName: "Rafa",
                      Id: "0031I000004SLT3QAO",
                      LastName: "Kasczka"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Account");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                      },
                      Id: "0011I000007Cy18QAC",
                      Website: "krakowtraders.pl",
                      Name: "Krakow Trades",
                      Mrr__c: 450,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/accoundId2342"
                      },
                      Id: "accoundId2342",
                      Website: "krakowtraders.pl",
                      Name: "Krakow Trades",
                      Mrr__c: 450,
                      CS_Stage__c: "Pending"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBody = createSoapEnvelope("updateResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<update><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "UserUpdateAccountMessage1",
              user: {
                accepts_marketing: false,
                anonymous_ids: ["salesforce:00Q1I000004WHchUAG"],
                created_at: "2017-12-27T16:46:48Z",
                domain: "krakowtraders.pl",
                email: "adam.pietrzyk@krakowtraders.pl",
                first_name: "Adam",
                has_password: false,
                id: "5a43ce781f6d9f471d005d44",
                is_approved: false,
                last_name: "Pietrzyk",
                name: "Adam Pietrzyk",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                traits_coconuts: 38,
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_main_contact/account_id":
                  "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 38]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "UserUpdateAccountMessage2",
              user: {
                accepts_marketing: false,
                anonymous_ids: [
                  "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
                ],
                created_at: "2017-09-25T21:32:07Z",
                domain: "krakowtraders.pl",
                email: "rafa.kasczka@krakowtraders.pl",
                first_name: "Rafa",
                first_seen_at: "2017-09-25T21:32:07Z",
                first_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                first_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                first_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                first_session_started_at: "2017-09-25T21:32:07Z",
                has_password: false,
                id: "59c975d75226a8c3a6001f40",
                is_approved: false,
                last_known_ip: "8.8.8.8",
                last_name: "Kasczka",
                last_seen_at: "2017-12-27T18:13:01Z",
                latest_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                latest_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                latest_session_platform_id: "59cd3c9aflhga35e5f52b14a000944",
                latest_session_started_at: "2017-12-27T18:13:01Z",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                signup_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                signup_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                signup_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                signup_session_started_at: "2017-09-25T21:32:07Z",
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
                "traits_pardottesting/demo_requested":
                  "2017-10-06T12:17:12+00:00",
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
                "traits_pardottesting/use_case":
                  "Spicy jalapeno bacon ipsum dolor amet landjaeger flank fatback tongue ground round shankle pork belly, frankfurter tenderloin filet mignon cupim. Jerky rump burgdoggen jowl ribeye short loin ground round shank cow meatloaf kevin. Shank drumstick jowl filet mignon t-bone turkey flank meatball cow pork belly prosciutto kielbasa. Shoulder biltong cow, hamburger tenderloin kevin turducken tri-tip swine chicken tongue andouille. Pork ball tip burgdoggen bacon andouille beef sausage turkey doner. Jerky meatball venison tail pork loin pork belly beef capicola, ribeye salami.",
                "traits_pardottesting/visits_pricingpage": 18,
                traits_recomputef: "2017-10-02T09:49:39.790Z",
                "traits_testdif/nonesense_at": "2011-10-17T18:00:04+00:00",
                "traits_testdif/nonesensecount": 4,
                traits_testing_coconuts: 12,
                traits_testing_date: "2017-10-10T10:10:10+00:00",
                traits_testing_string: 123,
                traits_testsup150: true,
                traits_coconuts: 48,
                traits_company: "Krakow Traders",
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_main_contact/account_id":
                  "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 45]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 237,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 287,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl'%2C%20'rafa.kasczka%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_domain: "krakowtraders.pl",
                account_anonymous_id: "salesforce_main:0011I000007Cy18QAC"
              },
              {
                record: {
                  Mrr__c: 950,
                  Id: "0011I000007Cy18QAC"
                },
                operation: "update",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "5a43ce781f6d9f471d005d44",
                user_email: "adam.pietrzyk@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "59c975d75226a8c3a6001f40",
                user_email: "rafa.kasczka@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  domain: "krakowtraders.pl",
                  anonymous_id: "salesforce_main:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce_main/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should update an account, via the user, with messy data a single account match ", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        contact_synchronized_segments: ["59f09bc7f9c5a94af600076d"],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        lead_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: false
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        lead_attributes_inbound: [
          {
            service: "FirstName",
            hull: "traits_salesforce_lead/first_name",
            overwrite: false
          },
          {
            service: "LastName",
            hull: "traits_salesforce_lead/last_name",
            overwrite: false
          },
          {
            service: "Company",
            hull: "traits_salesforce_lead/company",
            overwrite: false
          },
          {
            service: "Email",
            hull: "traits_salesforce_lead/email",
            overwrite: false
          },
          {
            service: "Website",
            hull: "traits_salesforce_lead/website",
            overwrite: false
          }
        ],
        contact_attributes_inbound: [
          {
            hull: "traits_salesforce_contact/first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/email",
            service: "Email",
            overwrite: false
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return (
                  query.q &&
                  query.q ===
                    "SELECT FirstName, LastName, Email, Id, AccountId FROM Contact WHERE Email IN ('adam.pietrzyk@krakowtraders.pl', 'rafa.kasczka@krakowtraders.pl') ORDER BY CreatedDate ASC LIMIT 10000"
                );
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/00Q1I000004WO7uUAG"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "adam.pietrzyk@krakowtraders.pl",
                      FirstName: "Adam",
                      Id: "00Q1I000004WO7uUAG",
                      LastName: "Pietrzyk"
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/0031I000004SLT3QAO"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "rafa.kasczka@krakowtraders.pl",
                      FirstName: "Rafa",
                      Id: "0031I000004SLT3QAO",
                      LastName: "Kasczka"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return (
                  query.q &&
                  query.q ===
                    "SELECT Website, Name, Mrr__c, CS_Stage__c, Id FROM Account WHERE Website LIKE '%krakowtraders.pl%' ORDER BY CreatedDate ASC LIMIT 10000"
                );
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9944I000007Cy18QAC"
                      },
                      Id: "9944I000007Cy18QAC",
                      Website: "krakowtraderspl",
                      Name: "krakowtraderspl copy paste",
                      Mrr__c: 9,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9966I000007Cy18QAC"
                      },
                      Id: "9966I000007Cy18QAC",
                      Website: "ilovekrakowtraders.pl",
                      Name: "I Love Krakowtraders Fan Club",
                      Mrr__c: 90,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9977I000007Cy18QAC"
                      },
                      Id: "9977I000007Cy18QAC",
                      Website: "i-breath-krakowtraders.pl",
                      Name: "I Breath Krakowtraders Fan Club",
                      Mrr__c: 90,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                      },
                      Id: "0011I000007Cy18QAC",
                      Website: "https://krakowtraders.pl",
                      Name: "Krakow Traders",
                      Mrr__c: 450,
                      CS_Stage__c: "Pending"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBody = createSoapEnvelope("updateResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });
            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<update><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "UserUpdateAccountMessage1",
              user: {
                accepts_marketing: false,
                anonymous_ids: ["salesforce:00Q1I000004WHchUAG"],
                created_at: "2017-12-27T16:46:48Z",
                domain: "krakowtraders.pl",
                email: "adam.pietrzyk@krakowtraders.pl",
                first_name: "Adam",
                has_password: false,
                id: "5a43ce781f6d9f471d005d44",
                is_approved: false,
                last_name: "Pietrzyk",
                name: "Adam Pietrzyk",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                traits_coconuts: 38,
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 38]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "UserUpdateAccountMessage2",
              user: {
                accepts_marketing: false,
                anonymous_ids: [
                  "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
                ],
                created_at: "2017-09-25T21:32:07Z",
                domain: "krakowtraders.pl",
                email: "rafa.kasczka@krakowtraders.pl",
                first_name: "Rafa",
                first_seen_at: "2017-09-25T21:32:07Z",
                first_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                first_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                first_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                first_session_started_at: "2017-09-25T21:32:07Z",
                has_password: false,
                id: "59c975d75226a8c3a6001f40",
                is_approved: false,
                last_known_ip: "8.8.8.8",
                last_name: "Kasczka",
                last_seen_at: "2017-12-27T18:13:01Z",
                latest_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                latest_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                latest_session_platform_id: "59cd3c9aflhga35e5f52b14a000944",
                latest_session_started_at: "2017-12-27T18:13:01Z",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                signup_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                signup_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                signup_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                signup_session_started_at: "2017-09-25T21:32:07Z",
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
                "traits_pardottesting/demo_requested":
                  "2017-10-06T12:17:12+00:00",
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
                "traits_pardottesting/use_case":
                  "Spicy jalapeno bacon ipsum dolor amet landjaeger flank fatback tongue ground round shankle pork belly, frankfurter tenderloin filet mignon cupim. Jerky rump burgdoggen jowl ribeye short loin ground round shank cow meatloaf kevin. Shank drumstick jowl filet mignon t-bone turkey flank meatball cow pork belly prosciutto kielbasa. Shoulder biltong cow, hamburger tenderloin kevin turducken tri-tip swine chicken tongue andouille. Pork ball tip burgdoggen bacon andouille beef sausage turkey doner. Jerky meatball venison tail pork loin pork belly beef capicola, ribeye salami.",
                "traits_pardottesting/visits_pricingpage": 18,
                traits_recomputef: "2017-10-02T09:49:39.790Z",
                "traits_testdif/nonesense_at": "2011-10-17T18:00:04+00:00",
                "traits_testdif/nonesensecount": 4,
                traits_testing_coconuts: 12,
                traits_testing_date: "2017-10-10T10:10:10+00:00",
                traits_testing_string: 123,
                traits_testsup150: true,
                traits_coconuts: 48,
                traits_company: "Krakow Traders",
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 45]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 237,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 287,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl'%2C%20'rafa.kasczka%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_domain: "krakowtraders.pl",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Mrr__c: 950,
                  Id: "0011I000007Cy18QAC"
                },
                operation: "update",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "5a43ce781f6d9f471d005d44",
                user_email: "adam.pietrzyk@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "59c975d75226a8c3a6001f40",
                user_email: "rafa.kasczka@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  domain: "krakowtraders.pl",
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should update an account with messy data, via the user, that has not been synced in salessorce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        contact_synchronized_segments: ["59f09bc7f9c5a94af600076d"],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        lead_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: false
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        lead_attributes_inbound: [
          {
            service: "FirstName",
            hull: "traits_salesforce_lead/first_name",
            overwrite: false
          },
          {
            service: "LastName",
            hull: "traits_salesforce_lead/last_name",
            overwrite: false
          },
          {
            service: "Company",
            hull: "traits_salesforce_lead/company",
            overwrite: false
          },
          {
            service: "Email",
            hull: "traits_salesforce_lead/email",
            overwrite: false
          },
          {
            service: "Website",
            hull: "traits_salesforce_lead/website",
            overwrite: false
          }
        ],
        contact_attributes_inbound: [
          {
            hull: "traits_salesforce_contact/first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/email",
            service: "Email",
            overwrite: false
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return (
                  query.q &&
                  query.q ===
                    "SELECT FirstName, LastName, Email, Id, AccountId FROM Contact WHERE Email IN ('adam.pietrzyk@krakowtraders.pl', 'rafa.kasczka@krakowtraders.pl') ORDER BY CreatedDate ASC LIMIT 10000"
                );
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/00Q1I000004WO7uUAG"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "adam.pietrzyk@krakowtraders.pl",
                      FirstName: "Adam",
                      Id: "00Q1I000004WO7uUAG",
                      LastName: "Pietrzyk"
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/0031I000004SLT3QAO"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "rafa.kasczka@krakowtraders.pl",
                      FirstName: "Rafa",
                      Id: "0031I000004SLT3QAO",
                      LastName: "Kasczka"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return (
                  query.q &&
                  query.q ===
                    "SELECT Website, Name, Mrr__c, CS_Stage__c, Id FROM Account WHERE Website LIKE '%krakowtraders.pl%' ORDER BY CreatedDate ASC LIMIT 10000"
                );
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9922I000007Cy18QAC"
                      },
                      Id: "9922I000007Cy18QAC",
                      Website: "https://apac.krakowtraders.pl",
                      Name: "Krakow Traders Asia Pacific LLC",
                      Mrr__c: 990,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9933I000007Cy18QAC"
                      },
                      Id: "9933I000007Cy18QAC",
                      Website: "/krakowtraders.pl",
                      Name: "Krakow Tr Typos",
                      Mrr__c: 99,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9944I000007Cy18QAC"
                      },
                      Id: "9944I000007Cy18QAC",
                      Website: "krakowtraderspl",
                      Name: "krakowtraderspl copy paste",
                      Mrr__c: 9,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9966I000007Cy18QAC"
                      },
                      Id: "9966I000007Cy18QAC",
                      Website: "ilovekrakowtraders.pl",
                      Name: "I Love Krakowtraders Fan Club",
                      Mrr__c: 90,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9977I000007Cy18QAC"
                      },
                      Id: "9977I000007Cy18QAC",
                      Website: "i-breath-krakowtraders.pl",
                      Name: "I Breath Krakowtraders Fan Club",
                      Mrr__c: 90,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                      },
                      Id: "0011I000007Cy18QAC",
                      Website: "https://krakowtraders.pl",
                      Name: "Krakow Traders",
                      Mrr__c: 450,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9988I000007Cy18QAC"
                      },
                      Id: "9988I000007Cy18QAC",
                      Website: "www.krakowtraders.pl",
                      Name: "Krakow Traders Duplicate #1",
                      Mrr__c: 950,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9999I000007Cy18QAC"
                      },
                      Id: "9999I000007Cy18QAC",
                      Website: "http://www.krakowtraders.pl/services",
                      Name: "Krakow Traders Duplicate #2",
                      Mrr__c: 950,
                      CS_Stage__c: "Pending"
                    },
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/9955I000007Cy18QAC"
                      },
                      Id: "9955I000007Cy18QAC",
                      Website: "krakowtraders.pl/is/the/best",
                      Name: "Krakowtraders.pl is the best",
                      Mrr__c: 900,
                      CS_Stage__c: "Pending"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBody = createSoapEnvelope("updateResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });

            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<update><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "UserUpdateAccountMessage1",
              user: {
                accepts_marketing: false,
                anonymous_ids: ["salesforce:00Q1I000004WHchUAG"],
                created_at: "2017-12-27T16:46:48Z",
                domain: "krakowtraders.pl",
                email: "adam.pietrzyk@krakowtraders.pl",
                first_name: "Adam",
                has_password: false,
                id: "5a43ce781f6d9f471d005d44",
                is_approved: false,
                last_name: "Pietrzyk",
                name: "Adam Pietrzyk",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                traits_coconuts: 38,
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 38]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "UserUpdateAccountMessage2",
              user: {
                accepts_marketing: false,
                anonymous_ids: [
                  "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
                ],
                created_at: "2017-09-25T21:32:07Z",
                domain: "krakowtraders.pl",
                email: "rafa.kasczka@krakowtraders.pl",
                first_name: "Rafa",
                first_seen_at: "2017-09-25T21:32:07Z",
                first_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                first_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                first_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                first_session_started_at: "2017-09-25T21:32:07Z",
                has_password: false,
                id: "59c975d75226a8c3a6001f40",
                is_approved: false,
                last_known_ip: "8.8.8.8",
                last_name: "Kasczka",
                last_seen_at: "2017-12-27T18:13:01Z",
                latest_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                latest_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                latest_session_platform_id: "59cd3c9aflhga35e5f52b14a000944",
                latest_session_started_at: "2017-12-27T18:13:01Z",
                segment_ids: ["59f09bc7f9c5a94af600076d"],
                signup_session_initial_referrer:
                  "https://dashboard.hullapp.io/12345/ships/abcda/customize",
                signup_session_initial_url:
                  "https://dashboard.hullapp.io/12345/ships/abcda/admin.html",
                signup_session_platform_id: "59c975cd2c8lahfsgn96b5cb8001f3a",
                signup_session_started_at: "2017-09-25T21:32:07Z",
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
                "traits_pardottesting/demo_requested":
                  "2017-10-06T12:17:12+00:00",
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
                "traits_pardottesting/use_case":
                  "Spicy jalapeno bacon ipsum dolor amet landjaeger flank fatback tongue ground round shankle pork belly, frankfurter tenderloin filet mignon cupim. Jerky rump burgdoggen jowl ribeye short loin ground round shank cow meatloaf kevin. Shank drumstick jowl filet mignon t-bone turkey flank meatball cow pork belly prosciutto kielbasa. Shoulder biltong cow, hamburger tenderloin kevin turducken tri-tip swine chicken tongue andouille. Pork ball tip burgdoggen bacon andouille beef sausage turkey doner. Jerky meatball venison tail pork loin pork belly beef capicola, ribeye salami.",
                "traits_pardottesting/visits_pricingpage": 18,
                traits_recomputef: "2017-10-02T09:49:39.790Z",
                "traits_testdif/nonesense_at": "2011-10-17T18:00:04+00:00",
                "traits_testdif/nonesensecount": 4,
                traits_testing_coconuts: 12,
                traits_testing_date: "2017-10-10T10:10:10+00:00",
                traits_testing_string: 123,
                traits_testsup150: true,
                traits_coconuts: 48,
                traits_company: "Krakow Traders",
                indexed_at: "2017-12-27T18:15:54+00:00",
                "traits_salesforce_contact/account_id": "0011I000007Cy18QAC"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 45]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 237,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 287,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl'%2C%20'rafa.kasczka%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_domain: "krakowtraders.pl",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Mrr__c: 950,
                  Id: "0011I000007Cy18QAC"
                },
                operation: "update",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "5a43ce781f6d9f471d005d44",
                user_email: "adam.pietrzyk@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "59c975d75226a8c3a6001f40",
                user_email: "rafa.kasczka@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  domain: "krakowtraders.pl",
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should update an account, via user update, that was already synced in salesforce", () => {
    const connector = {
      private_settings: {
        ...private_settings,
        lead_synchronized_segments: [],
        contact_synchronized_segments: ["59f09bc7f9c5a94af600076d"],
        account_synchronized_segments: [
          "accountSegmentId1",
          "accountSegmentId2"
        ],
        lead_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        contact_attributes_outbound: [
          {
            hull: "first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "email",
            service: "Email",
            overwrite: false
          }
        ],
        account_claims: [
          {
            hull: "domain",
            service: "Website",
            required: true
          }
        ],
        account_attributes_outbound: [
          {
            hull: "domain",
            service: "Website",
            overwrite: false
          },
          {
            hull: "name",
            service: "Name",
            overwrite: false
          },
          {
            hull: "mrr",
            service: "Mrr__c",
            overwrite: true
          },
          {
            hull: "cs_stage",
            service: "CS_Stage__c",
            overwrite: true
          }
        ],
        lead_attributes_inbound: [
          {
            service: "FirstName",
            hull: "traits_salesforce_lead/first_name",
            overwrite: false
          },
          {
            service: "LastName",
            hull: "traits_salesforce_lead/last_name",
            overwrite: false
          },
          {
            service: "Company",
            hull: "traits_salesforce_lead/company",
            overwrite: false
          },
          {
            service: "Email",
            hull: "traits_salesforce_lead/email",
            overwrite: false
          },
          {
            service: "Website",
            hull: "traits_salesforce_lead/website",
            overwrite: false
          }
        ],
        contact_attributes_inbound: [
          {
            hull: "traits_salesforce_contact/first_name",
            service: "FirstName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/last_name",
            service: "LastName",
            overwrite: false
          },
          {
            hull: "traits_salesforce_contact/email",
            service: "Email",
            overwrite: false
          }
        ],
        account_attributes_inbound: [
          {
            hull: "salesforce/website",
            service: "Website",
            overwrite: true
          },
          {
            hull: "salesforce/name",
            service: "Name",
            overwrite: true
          },
          {
            hull: "salesforce/mrr",
            service: "Mrr__c",
            overwrite: true
          }
        ]
      }
    };
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.notificationHandler,
          handlerUrl: "smart-notifier",
          channel: "user:update",
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Contact");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/00Q1I000004WO7uUAG"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "adam.pietrzyk@krakowtraders.pl",
                      FirstName: "Adam",
                      Id: "00Q1I000004WO7uUAG",
                      LastName: "Pietrzyk"
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Account/0031I000004SLT3QAO"
                      },
                      AccountId: "0011I000007Cy18QAC",
                      Email: "rafa.kasczka@krakowtraders.pl",
                      FirstName: "Rafa",
                      Id: "0031I000004SLT3QAO",
                      LastName: "Kasczka"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Account");
              })
              .reply(
                200,
                {
                  records: [
                    {
                      attributes: {
                        type: "Account",
                        url:
                          "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                      },
                      Id: "0011I000007Cy18QAC",
                      Website: "krakowtraders.pl",
                      Name: "Krakow Trades",
                      Mrr__c: 450,
                      CS_Stage__c: "Pending"
                    }
                  ],
                  done: true
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            const respBody = createSoapEnvelope("updateResponse", {
              result: [{ id: "0011I000007Cy18QAC", success: "true" }]
            });

            nock("https://na98.salesforce.com")
              .post("/services/Soap/u/39.0", body => {
                return (
                  body.indexOf("<update><sObjects><type>Account</type>") !== -1
                );
              })
              .reply(200, respBody, {
                "Content-Type": "text/xml",
                "sforce-limit-info": "api-usage=500/50000"
              });

            return scope;
          },
          connector,
          messages: [
            {
              message_id: "UserUpdateAccountMessage1",
              user: {
                accepts_marketing: false,
                anonymous_ids: ["salesforce:00Q1I000004WHchUAG"],
                domain: "krakowtraders.pl",
                email: "adam.pietrzyk@krakowtraders.pl",
                first_name: "Adam",
                id: "5a43ce781f6d9f471d005d44",
                last_name: "Pietrzyk",
                name: "Adam Pietrzyk"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                employees: 2,
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                industry: "Technology",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                _sales_business_won: "2017-10-25T12:45:00Z",
                cs_stage: "Pending",
                "salesforce/id": "0011I000007Cy18QAC"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 38]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            },
            {
              message_id: "UserUpdateAccountMessage2",
              user: {
                accepts_marketing: false,
                anonymous_ids: [
                  "1496191053-c05dac0f-ad75-479a-8aef-4feff68cfc80"
                ],
                created_at: "2017-09-25T21:32:07Z",
                domain: "krakowtraders.pl",
                email: "rafa.kasczka@krakowtraders.pl",
                first_name: "Rafa",
                id: "59c975d75226a8c3a6001f40",
                last_name: "Kasczka"
              },
              segments: [
                {
                  id: "59f09bc7f9c5a94af600076d",
                  name: "Users signed in last 100 days",
                  type: "users_segment",
                  created_at: "2017-10-25T14:12:23Z",
                  updated_at: "2017-10-25T14:12:23Z"
                }
              ],
              account: {
                created_at: "2017-10-25T10:06:00Z",
                domain: "krakowtraders.pl",
                id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                name: "Krakow Traders",
                plan: "Enterprise",
                mrr: 950,
                cs_stage: "Pending",
                "salesforce/id": "0011I000007Cy18QAC"
              },
              account_segments: [
                {
                  id: "accountSegmentId1",
                  name: "accountSegment1",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                },
                {
                  id: "accountSegmentId3",
                  name: "accountSegment3",
                  updated_at: "2019-04-30T22:00:24Z",
                  type: "accounts_segment",
                  created_at: "2019-04-30T22:00:24Z"
                }
              ],
              events: [],
              changes: {
                user: {
                  traits_coconuts: [null, 45]
                },
                segments: {},
                account: {},
                account_segments: {},
                is_new: false
              }
            }
          ],
          response: { flow_control: { type: "next" } },
          logs: [
            [
              "info",
              "outgoing.job.start",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ],
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 277,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Website%2C%20Name%2C%20Mrr__c%2C%20CS_Stage__c%2C%20Id%20FROM%20Account%20WHERE%20Id%20IN%20('0011I000007Cy18QAC')%20OR%20Website%20LIKE%20'%25krakowtraders.pl%25'%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            expect.arrayContaining([
              "ship.service_api.request",
              {
                method: "GET",
                url_length: 287,
                url:
                  "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20FirstName%2C%20LastName%2C%20Email%2C%20Id%2C%20AccountId%20FROM%20Contact%20WHERE%20Email%20IN%20('adam.pietrzyk%40krakowtraders.pl'%2C%20'rafa.kasczka%40krakowtraders.pl')%20ORDER%20BY%20CreatedDate%20ASC%20LIMIT%2010000"
              }
            ]),
            [
              "info",
              "outgoing.account.success",
              {
                subject_type: "account",
                request_id: expect.whatever(),
                account_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                account_domain: "krakowtraders.pl",
                account_anonymous_id: "salesforce:0011I000007Cy18QAC"
              },
              {
                record: {
                  Mrr__c: 950,
                  Id: "0011I000007Cy18QAC"
                },
                operation: "update",
                resource: "Account"
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "5a43ce781f6d9f471d005d44",
                user_email: "adam.pietrzyk@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.user.skip",
              {
                subject_type: "user",
                request_id: expect.whatever(),
                user_id: "59c975d75226a8c3a6001f40",
                user_email: "rafa.kasczka@krakowtraders.pl"
              },
              {
                reason:
                  "The contact in Salesforce is already in sync with Hull."
              }
            ],
            [
              "info",
              "outgoing.job.success",
              { request_id: expect.whatever() },
              { jobName: "Outgoing Data", type: "webpayload" }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asAccount: {
                  id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
                  domain: "krakowtraders.pl",
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": {
                  value: "0011I000007Cy18QAC",
                  operation: "setIfNull"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1]
          ],
          platformApiCalls: []
        };
      }
    );
  });
});
