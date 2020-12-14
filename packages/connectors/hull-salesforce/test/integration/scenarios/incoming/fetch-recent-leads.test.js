// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
  refresh_token:
    "3Kep801hRJqEPUTYG_dW97P8laAje15mN6om7CqloiJSXBzxCJe5v32KztUkaWCm4GqBsKxm5UgDbG9Zt1gn4Y.",
  access_token:
    "99A5L000002rwPv!WEkDFONqSN.K2dfgNwPcPQdleLxBwAZcDEFGHrZOIYtDSr8IDDmTlJRKdFGH1Cn0xw3BfKHEWnceyK9WZerHU6iRgflKwzOBo",
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

describe("Fetch Leads Tests", () => {
  it("should fetch a single lead", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-leads",
          connector: {
            private_settings: {
              ...private_settings,
              fetch_resource_schema: true,
              lead_claims: [{ hull: "email", service: "EmailCustom__c" }],
              contact_claims: [{ hull: "email", service: "SomeField" }],
              lead_synchronized_segments: ["5a0c1f07b4d8644425002c65"],
              lead_attributes_outbound: [
                {
                  hull: "first_name",
                  service: "FirstName",
                  overwrite: true
                },
                {
                  hull: "last_name",
                  service: "LastName",
                  overwrite: true
                },
                {
                  hull: "email",
                  service: "Email",
                  overwrite: true
                }
              ],
              contact_attributes_outbound: [
                {
                  hull: "first_name",
                  service: "FirstName",
                  overwrite: true
                },
                {
                  hull: "last_name",
                  service: "LastName",
                  overwrite: true
                },
                {
                  hull: "email",
                  service: "Email",
                  overwrite: true
                }
              ],
              account_attributes_outbound: [
                {
                  hull: "domain",
                  service: "Website",
                  overwrite: true
                },
                {
                  hull: "name",
                  service: "Name",
                  overwrite: true
                }
              ],
              lead_attributes_inbound: [
                {
                  service: "FirstName",
                  hull: "traits_salesforce_lead/first_name",
                  overwrite: true
                },
                {
                  service: "LastName",
                  hull: "traits_salesforce_lead/custom_last_name_field",
                  overwrite: true
                },
                {
                  service: "EmailCustom__c",
                  hull: "traits_salesforce_lead/email",
                  overwrite: true
                },
                {
                  service: "Company",
                  hull: "traits_salesforce_lead/company",
                  overwrite: true
                },
                {
                  service: "Website",
                  hull: "traits_salesforce_lead/website",
                  overwrite: true
                },
                {
                  service: "Department",
                  hull: "traits_salesforce_lead/contact_department",
                  overwrite: true
                },
                {
                  service: "UserSegments__c",
                  hull: "traits_salesforce_lead/user_segments",
                  overwrite: true
                }
              ],
              account_attributes_inbound: [
                {
                  service: "Website",
                  hull: "website",
                  overwrite: true
                }
              ],
              account_claims: [
                {
                  hull: "domain",
                  service: "Website",
                  required: true
                },
                {
                  hull: "external_id",
                  service: "CustomField1",
                  required: false
                }
              ]
            }
          },
          usersSegments: [],
          accountsSegments: [],
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return query.q && query.q.match("FROM Lead");
              })
              .reply(
                200,
                {
                  totalSize: 1,
                  nextRecordsUrl: "/services/data/v42.0/query/0go0dVM-2000",
                  done: true,
                  records: [
                    {
                      attributes: {
                        type: "Lead",
                        url:
                          "/services/data/v39.0/sobjects/Lead/00Q1I000004WHbtUAG"
                      },
                      Id: "00Q1I000004WHbtUAG",
                      EmailCustom__c: "becci.blankenshield@adventure-works.com",
                      FirstName: "Becci",
                      LastName: "Blankenshield",
                      Company: "Adventure Works",
                      Website: "adventure-works.com",
                      Status: "Open - Not Contacted",
                      UserSegments__c: "segment3;segment1;Segment2;12;1;21"
                    }
                  ]
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            return scope;
          },
          response: { status: "deferred" },
          logs: [
            [
              "info",
              "incoming.job.start",
              {},
              {
                jobName: "Incoming Data",
                type: "webpayload"
              }
            ],
            [
              "debug",
              "ship.service_api.request",
              {},
              {
                method: "GET",
                url_length: expect.whatever(),
                url: expect.stringMatching(/.*FROM.*Lead.*/)
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_anonymous_id: "salesforce-lead:00Q1I000004WHbtUAG",
                user_email: "becci.blankenshield@adventure-works.com"
              },
              {
                data: {
                  attributes: {
                    type: "Lead",
                    url: "/services/data/v39.0/sobjects/Lead/00Q1I000004WHbtUAG"
                  },
                  Id: "00Q1I000004WHbtUAG",
                  EmailCustom__c: "becci.blankenshield@adventure-works.com",
                  FirstName: "Becci",
                  LastName: "Blankenshield",
                  Company: "Adventure Works",
                  Website: "adventure-works.com",
                  Status: "Open - Not Contacted",
                  UserSegments__c: "segment3;segment1;Segment2;12;1;21"
                },
                type: "Lead"
              }
            ],
            [
              "info",
              "incoming.job.success",
              {},
              {
                jobName: "Incoming Data",
                type: "webpayload"
              }
            ]
          ],
          firehoseEvents: [
            [
              "traits",
              {
                asUser: {
                  email: "becci.blankenshield@adventure-works.com",
                  anonymous_id: "salesforce-lead:00Q1I000004WHbtUAG"
                },
                subjectType: "user"
              },
              {
                first_name: {
                  value: "Becci",
                  operation: "setIfNull"
                },
                "salesforce_lead/first_name": {
                  value: "Becci",
                  operation: "set"
                },
                last_name: {
                  value: "Blankenshield",
                  operation: "setIfNull"
                },
                "salesforce_lead/custom_last_name_field": {
                  value: "Blankenshield",
                  operation: "set"
                },
                "salesforce_lead/email": {
                  value: "becci.blankenshield@adventure-works.com",
                  operation: "set"
                },
                "salesforce_lead/company": {
                  value: "Adventure Works",
                  operation: "set"
                },
                "salesforce_lead/website": {
                  value: "adventure-works.com",
                  operation: "set"
                },
                "salesforce_lead/user_segments": {
                  value: "segment3;segment1;Segment2;12;1;21",
                  operation: "set"
                },
                "salesforce_lead/id": {
                  value: "00Q1I000004WHbtUAG",
                  operation: "set"
                }
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500]
          ],
          platformApiCalls: [
            ["GET", "/api/v1/app", {}, {}],
            [
              "PUT",
              "/api/v1/9993743b22d60dd829001999",
              {},
              expect.objectContaining({ private_settings: expect.whatever() })
            ]
          ]
        };
      }
    );
  });
});
