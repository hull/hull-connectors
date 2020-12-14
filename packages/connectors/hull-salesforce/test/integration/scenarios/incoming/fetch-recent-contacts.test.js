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
  account_synchronized_segments: [],
  lead_claims: [],
  contact_claims: [{ hull: "email", service: "Email" }]
};

describe("Fetch Contacts Tests", () => {
  it("should fetch a deleted contact", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-deleted-contacts",
          connector: {
            private_settings: {
              ...private_settings,
              handle_merges: true,
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
                  hull: "traits_salesforce_lead/last_name",
                  overwrite: true
                },
                {
                  service: "Company",
                  hull: "traits_salesforce_lead/company",
                  overwrite: true
                },
                {
                  service: "Email",
                  hull: "traits_salesforce_lead/email",
                  overwrite: true
                },
                {
                  service: "Website",
                  hull: "traits_salesforce_lead/website",
                  overwrite: true
                }
              ],
              contact_attributes_inbound: [
                {
                  service: "FirstName",
                  hull: "traits_salesforce_contact/first_name",
                  overwrite: true
                },
                {
                  service: "LastName",
                  hull: "traits_salesforce_contact/last_name",
                  overwrite: true
                },
                {
                  service: "Email",
                  hull: "traits_salesforce_contact/email",
                  overwrite: true
                }
              ],
              account_attributes_inbound: [
                {
                  service: "Website",
                  hull: "website",
                  overwrite: true
                }
              ]
            }
          },
          usersSegments: [],
          accountsSegments: [],
          externalApiMock: () => {
            const scope = nock("https://na98.salesforce.com");

            scope
              .get("/services/data/v39.0/sobjects/Contact/deleted")
              .query(query => {
                return query.start && query.end;
              })
              .reply(
                200,
                {
                  deletedRecords: [
                    {
                      deletedDate: "2018-09-10T16:38:43.000+0000",
                      id: "0032F000008DdqkQAC"
                    }
                  ],
                  earliestDateAvailable: "2017-05-16T18:58:00.000+0000",
                  latestDateCovered: "2018-09-10T18:31:00.000+0000"
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/queryAll")
              .query(query => {
                return (
                  query.q ===
                  "SELECT MasterRecordId FROM Contact WHERE Id IN ('0032F000008DdqkQAC')"
                );
              })
              .reply(
                200,
                {
                  totalSize: 2,
                  done: true,
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v42.0/sobjects/Contact/0032F000008DdqkQAC"
                      },
                      MasterRecordId: "master_record_id_1"
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v42.0/sobjects/Contact/0032F000008DdqkQAC-fake"
                      },
                      MasterRecordId: "master_record_id_2"
                    }
                  ]
                },
                { "sforce-limit-info": "api-usage=500/50000" }
              );

            scope
              .get("/services/data/v39.0/query")
              .query(query => {
                return (
                  query.q ===
                  "SELECT Id,IsDeleted FROM Contact WHERE Id IN ('master_record_id_1','master_record_id_2')"
                );
              })
              .reply(
                200,
                {
                  totalSize: 3,
                  done: true,
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v42.0/sobjects/Contact/master_record_id_1"
                      },
                      Id: "master_record_id_1",
                      IsDeleted: true
                    },
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v42.0/sobjects/Contact/master_record_id_2"
                      },
                      Id: "master_record_id_2",
                      IsDeleted: false
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
                url: expect.stringContaining(
                  "https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/deleted?start"
                )
              }
            ],
            [
              "debug",
              "ship.service_api.request",
              {},
              {
                method: "GET",
                url_length: expect.whatever(),
                url: expect.stringContaining(
                  "https://na98.salesforce.com/services/data/v39.0/query"
                )
              }
            ],
            [
              "debug",
              "ship.service_api.request",
              {},
              {
                method: "GET",
                url_length: expect.whatever(),
                url: expect.stringContaining(
                  "https://na98.salesforce.com/services/data/v39.0/query"
                )
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_anonymous_id: "salesforce-contact:0032F000008DdqkQAC"
              },
              {
                data: {
                  attributes: {
                    "salesforce_contact/deleted_at":
                      "2018-09-10T16:38:43.000+0000",
                    "salesforce_contact/id": null
                  },
                  ident: {
                    anonymous_id: "salesforce-contact:0032F000008DdqkQAC"
                  }
                },
                type: "User"
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_anonymous_id: "salesforce-contact:master_record_id_2"
              },
              {
                data: {
                  attributes: {
                    "salesforce_contact/deleted_at": null,
                    "salesforce_contact/id": "master_record_id_2"
                  },
                  ident: {
                    anonymous_id: "salesforce-contact:master_record_id_2"
                  }
                },
                type: "User"
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
                  anonymous_id: "salesforce-contact:0032F000008DdqkQAC"
                },
                subjectType: "user"
              },
              {
                "salesforce_contact/deleted_at": "2018-09-10T16:38:43.000+0000",
                "salesforce_contact/id": null
              }
            ],
            [
              "traits",
              {
                asUser: {
                  anonymous_id: "salesforce-contact:master_record_id_2"
                },
                subjectType: "user"
              },
              {
                "salesforce_contact/deleted_at": null,
                "salesforce_contact/id": "master_record_id_2"
              }
            ]
          ],
          metrics: [
            ["increment", "connector.request", 1],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500],
            ["increment", "ship.service_api.call", 1],
            ["value", "ship.service_api.limit", 50000],
            ["value", "ship.service_api.remaining", 49500]
          ],
          platformApiCalls: []
        };
      }
    );
  });

  it("should fetch a single contact", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-contacts",
          connector: {
            private_settings: {
              ...private_settings,
              lead_synchronized_segments: [],
              lead_attributes_outbound: [],
              fetch_resource_schema: true,
              contact_attributes_outbound: [],
              account_attributes_outbound: [],
              lead_attributes_inbound: [],
              contact_attributes_inbound: [
                {
                  service: "FirstName",
                  hull: "traits_salesforce_contact/custom_first_name_field",
                  overwrite: true
                },
                {
                  service: "LastName",
                  hull: "traits_salesforce_contact/last_name",
                  overwrite: true
                },
                {
                  service: "Email",
                  hull: "traits_salesforce_contact/user_email",
                  overwrite: true
                },
                {
                  service: "ContactMultiPL__c",
                  hull: "traits_salesforce_contact/contact_multi_pl",
                  overwrite: true
                },
                {
                  service: "UserSegments__c",
                  hull: "traits_salesforce_contact/user_segments",
                  overwrite: true
                },
                {
                  service: "Department",
                  hull: "traits_salesforce_contact/contact_department",
                  overwrite: true
                }
              ],
              account_attributes_inbound: [],
              account_claims: []
            }
          },
          usersSegments: [],
          accountsSegments: [],
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
                  totalSize: 1,
                  nextRecordsUrl: "/services/data/v42.0/query/0go0dVM-2000",
                  done: true,
                  records: [
                    {
                      attributes: {
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
                      },
                      Id: "00Q1I000004WHbtUAG",
                      Email: "becci.blankenshield@adventure-works.com",
                      FirstName: "Becci",
                      LastName: "Blankenshield",
                      Company: "Adventure Works",
                      Website: "adventure-works.com",
                      Status: "Open - Not Contacted",
                      UserSegments__c: "segment3;segment1;Segment2;12;1;21",
                      ContactMultiPL__c: ["1", "2"]
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
                url: expect.whatever()
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_email: "becci.blankenshield@adventure-works.com",
                user_anonymous_id: "salesforce-contact:00Q1I000004WHbtUAG"
              },
              {
                data: {
                  attributes: {
                    type: "Contact",
                    url:
                      "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
                  },
                  Id: "00Q1I000004WHbtUAG",
                  Email: "becci.blankenshield@adventure-works.com",
                  FirstName: "Becci",
                  LastName: "Blankenshield",
                  Company: "Adventure Works",
                  Website: "adventure-works.com",
                  Status: "Open - Not Contacted",
                  UserSegments__c: "segment3;segment1;Segment2;12;1;21",
                  ContactMultiPL__c: ["1", "2"]
                },
                type: "Contact"
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
                  anonymous_id: "salesforce-contact:00Q1I000004WHbtUAG"
                },
                subjectType: "user"
              },
              {
                first_name: {
                  value: "Becci",
                  operation: "setIfNull"
                },
                last_name: {
                  value: "Blankenshield",
                  operation: "setIfNull"
                },
                "salesforce_contact/custom_first_name_field": {
                  value: "Becci",
                  operation: "set"
                },
                "salesforce_contact/last_name": {
                  value: "Blankenshield",
                  operation: "set"
                },
                "salesforce_contact/user_email": {
                  value: "becci.blankenshield@adventure-works.com",
                  operation: "set"
                },
                "salesforce_contact/contact_multi_pl": {
                  value: ["1", "2"],
                  operation: "set"
                },
                "salesforce_contact/user_segments": {
                  value: "segment3;segment1;Segment2;12;1;21",
                  operation: "set"
                },
                "salesforce_contact/id": {
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

  it("should fetch a contact and link to an account", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-contacts",
          connector: {
            private_settings: {
              ...private_settings,
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
              fetch_accounts: true,
              lead_attributes_inbound: [
                {
                  service: "FirstName",
                  hull: "traits_salesforce_lead/first_name",
                  overwrite: true
                },
                {
                  service: "LastName",
                  hull: "traits_salesforce_lead/last_name",
                  overwrite: true
                },
                {
                  service: "Company",
                  hull: "traits_salesforce_lead/company",
                  overwrite: true
                },
                {
                  service: "Email",
                  hull: "traits_salesforce_lead/email",
                  overwrite: true
                },
                {
                  service: "Website",
                  hull: "traits_salesforce_lead/website",
                  overwrite: true
                }
              ],
              contact_attributes_inbound: [
                {
                  service: "FirstName",
                  hull: "traits_salesforce_contact/first_name",
                  overwrite: true
                },
                {
                  service: "LastName",
                  hull: "traits_salesforce_contact/last_name",
                  overwrite: true
                },
                {
                  service: "Email",
                  hull: "traits_salesforce_contact/email",
                  overwrite: true
                },
                {
                  service: "ContactMultiPL__c",
                  hull: "traits_salesforce_contact/contact_multi_pl",
                  overwrite: true
                },
                {
                  service: "Department",
                  hull: "traits_salesforce_contact/contact_department",
                  overwrite: true
                }
              ],
              account_attributes_inbound: [
                {
                  service: "Website",
                  hull: "salesforce/website",
                  overwrite: true
                }
              ],
              link_accounts: true,
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
                return query.q && query.q.match("FROM Contact");
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
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
                      },
                      Id: "00Q1I000004WHbtUAG",
                      Email: "becci.blankenshield@adventure-works.com",
                      FirstName: "Becci",
                      LastName: "Blankenshield",
                      Company: "Adventure Works",
                      Website: "adventure-works.com",
                      Status: "Open - Not Contacted",
                      AccountId: "0011I000007Cy18QAC",
                      Account: {
                        attributes: {
                          type: "Account",
                          url:
                            "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                        },
                        Id: "0011I000007Cy18QAC",
                        Website: "krakowtraders.pl",
                        Name: "Krakow Trades",
                        Mrr__c: 950
                      }
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
                url: expect.whatever()
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_email: "becci.blankenshield@adventure-works.com",
                user_anonymous_id: "salesforce-contact:00Q1I000004WHbtUAG"
              },
              {
                data: {
                  attributes: {
                    type: "Contact",
                    url:
                      "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
                  },
                  Id: "00Q1I000004WHbtUAG",
                  Email: "becci.blankenshield@adventure-works.com",
                  FirstName: "Becci",
                  LastName: "Blankenshield",
                  Company: "Adventure Works",
                  Website: "adventure-works.com",
                  Status: "Open - Not Contacted",
                  AccountId: "0011I000007Cy18QAC",
                  Account: {
                    attributes: {
                      type: "Account",
                      url:
                        "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                    },
                    Id: "0011I000007Cy18QAC",
                    Website: "krakowtraders.pl",
                    Name: "Krakow Trades",
                    Mrr__c: 950
                  }
                },
                type: "Contact"
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
                  anonymous_id: "salesforce-contact:00Q1I000004WHbtUAG"
                },
                subjectType: "user"
              },
              {
                first_name: {
                  value: "Becci",
                  operation: "setIfNull"
                },
                last_name: {
                  value: "Blankenshield",
                  operation: "setIfNull"
                },
                "salesforce_contact/first_name": {
                  value: "Becci",
                  operation: "set"
                },
                "salesforce_contact/last_name": {
                  value: "Blankenshield",
                  operation: "set"
                },
                "salesforce_contact/email": {
                  value: "becci.blankenshield@adventure-works.com",
                  operation: "set"
                },
                "salesforce_contact/id": {
                  value: "00Q1I000004WHbtUAG",
                  operation: "set"
                }
              }
            ],
            [
              "traits",
              {
                asUser: {
                  email: "becci.blankenshield@adventure-works.com",
                  anonymous_id: "salesforce-contact:00Q1I000004WHbtUAG"
                },
                asAccount: {
                  anonymous_id: "salesforce:0011I000007Cy18QAC"
                },
                subjectType: "account"
              },
              {
                "salesforce/id": "0011I000007Cy18QAC"
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

  it("should fetch contact with related entity fields", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-contacts",
          connector: {
            private_settings: {
              ...private_settings,
              contact_attributes_inbound: [
                {
                  service: "Email",
                  hull: "traits_salesforce_contact/email",
                  overwrite: true
                },
                {
                  service: "OwnerId",
                  hull: "traits_salesforce_contact/owner_id",
                  overwrite: true
                },
                {
                  service: "Owner.Email",
                  hull: "traits_salesforce_contact/owner_email",
                  overwrite: true
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
                return query.q && query.q.match("FROM Contact");
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
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                      },
                      Id: "00Q1I000004WHchUAG",
                      Email: "adam@apple.com",
                      OwnerId: "10Q1I000004WHchU",
                      Owner: {
                        attributes: {
                          type: "User",
                          url:
                            "/services/data/v39.0/sobjects/User/10Q1I000004WHchU"
                        },
                        Email: "owner@hull.com"
                      }
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
                url: expect.whatever()
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_email: "adam@apple.com",
                user_anonymous_id: "salesforce-contact:00Q1I000004WHchUAG"
              },
              {
                data: {
                  attributes: {
                    type: "Contact",
                    url:
                      "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WHchUAG",
                  Email: "adam@apple.com",
                  OwnerId: "10Q1I000004WHchU",
                  Owner: {
                    attributes: {
                      type: "User",
                      url: "/services/data/v39.0/sobjects/User/10Q1I000004WHchU"
                    },
                    Email: "owner@hull.com"
                  }
                },
                type: "Contact"
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
                  email: "adam@apple.com",
                  anonymous_id: "salesforce-contact:00Q1I000004WHchUAG"
                },
                subjectType: "user"
              },
              {
                "salesforce_contact/email": {
                  value: "adam@apple.com",
                  operation: "set"
                },
                "salesforce_contact/owner_id": {
                  value: "10Q1I000004WHchU",
                  operation: "set"
                },
                "salesforce_contact/owner_email": {
                  value: "owner@hull.com",
                  operation: "set"
                },
                "salesforce_contact/id": {
                  value: "00Q1I000004WHchUAG",
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

  it("should fetch a single contact with broken attribute mapper", () => {
    return testScenario(
      { manifest, connectorConfig },
      ({ handlers, nock, expect }) => {
        return {
          handlerType: handlers.scheduleHandler,
          handlerUrl: "fetch-recent-contacts",
          connector: {
            private_settings: {
              ...private_settings,
              contact_attributes_inbound: [
                {
                  service: "Email",
                  hull: "traits_salesforce_contact/email",
                  overwrite: true
                },
                {
                  service: "Owner.Email",
                  hull: "traits_salesforce_contact/owner_email",
                  overwrite: true
                },
                {
                  service: "Description",
                  hull: "",
                  overwrite: true
                },
                {
                  service: "",
                  hull: "traits_salesforce_contact/about",
                  overwrite: true
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
                return query.q && query.q.match("FROM Contact");
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
                        type: "Contact",
                        url:
                          "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                      },
                      Id: "00Q1I000004WHchUAG",
                      Email: "adam@apple.com",
                      OwnerId: "10Q1I000004WHchU",
                      Owner: {
                        attributes: {
                          type: "User",
                          url:
                            "/services/data/v39.0/sobjects/User/0054P000008CIowQAG"
                        },
                        Email: "owner@hull.com"
                      }
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
                url: expect.whatever()
              }
            ],
            [
              "debug",
              "incoming.user.success",
              {
                subject_type: "user",
                user_email: "adam@apple.com",
                user_anonymous_id: "salesforce-contact:00Q1I000004WHchUAG"
              },
              {
                data: {
                  attributes: {
                    type: "Contact",
                    url:
                      "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WHchUAG",
                  Email: "adam@apple.com",
                  OwnerId: "10Q1I000004WHchU",
                  Owner: {
                    attributes: {
                      type: "User",
                      url:
                        "/services/data/v39.0/sobjects/User/0054P000008CIowQAG"
                    },
                    Email: "owner@hull.com"
                  }
                },
                type: "Contact"
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
                  email: "adam@apple.com",
                  anonymous_id: "salesforce-contact:00Q1I000004WHchUAG"
                },
                subjectType: "user"
              },
              {
                "salesforce_contact/email": {
                  value: "adam@apple.com",
                  operation: "set"
                },
                "salesforce_contact/owner_email": {
                  value: "owner@hull.com",
                  operation: "set"
                },
                "salesforce_contact/id": {
                  value: "00Q1I000004WHchUAG",
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
