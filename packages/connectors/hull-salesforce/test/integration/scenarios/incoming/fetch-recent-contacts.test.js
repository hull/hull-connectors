// @flow
import connectorConfig from "../../../../server/config";
import manifest from "../../../../manifest.json";
const testScenario = require("hull-connector-framework/src/test-scenario");

process.env.CLIENT_ID = "123";
process.env.CLIENT_SECRET = "123";

const private_settings = {
  instance_url: "https://na98.salesforce.com",
  refresh_token: "3Kep801hRJqEPUTYG_dW97P8laAje15mN6om7CqloiJSXBzxCJe5v32KztUkaWCm4GqBsKxm5UgDbG9Zt1gn4Y.",
  access_token: "99A5L000002rwPv!WEkDFONqSN.K2dfgNwPcPQdleLxBwAZcDEFGHrZOIYtDSr8IDDmTlJRKdFGH1Cn0xw3BfKHEWnceyK9WZerHU6iRgflKwzOBo",
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
  user_claims: [
    { "hull": "email", "service": "Email" }
  ],
}

describe("Fetch Contacts Tests", () => {

  it("should fetch a deleted contact", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-deleted-contacts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [
              "5a0c1f07b4d8644425002c65"
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
                "service": "FirstName",
                "hull": "traits_salesforce_contact/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_contact/last_name",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_contact/email",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "website",
                "overwrite": false
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
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, {
              deletedRecords: [
                {
                  deletedDate: "2018-09-10T16:38:43.000+0000",
                  id: "0032F000008DdqkQAC"
                }
              ],
              earliestDateAvailable: "2017-05-16T18:58:00.000+0000",
              latestDateCovered: "2018-09-10T18:31:00.000+0000"
            }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/deleted?start")
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_anonymous_id": "salesforce-contact:0032F000008DdqkQAC"
            },
            {
              "traits": {
                "salesforce_contact/first_name": {
                  "value": null,
                  "operation": "set"
                },
                "salesforce_contact/last_name": {
                  "value": null,
                  "operation": "set"
                },
                "salesforce_contact/email": {
                  "value": null,
                  "operation": "set"
                },
                "salesforce_contact/id": {
                  "value": null,
                  "operation": "set"
                },
                "salesforce_contact/deleted_at": {
                  "value": "2018-09-10T16:38:43.000+0000",
                  "operation": "set"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "anonymous_id": "salesforce-contact:0032F000008DdqkQAC"
              },
              "subjectType": "user"
            },
            {
              "salesforce_contact/first_name": {
                "value": null,
                "operation": "set"
              },
              "salesforce_contact/last_name": {
                "value": null,
                "operation": "set"
              },
              "salesforce_contact/email": {
                "value": null,
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": null,
                "operation": "set"
              },
              "salesforce_contact/deleted_at": {
                "value": "2018-09-10T16:38:43.000+0000",
                "operation": "set"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500]
          // TODO why is this missing?
          // ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch a single contact", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-contacts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [],
            "lead_attributes_outbound": [],
            "fetch_resource_schema": true,
            "contact_attributes_outbound": [],
            "account_attributes_outbound": [],
            "lead_attributes_inbound": [],
            "contact_attributes_inbound": [
              {
                "service": "FirstName",
                "hull": "traits_salesforce_contact/custom_first_name_field",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_contact/last_name",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_contact/user_email",
                "overwrite": false
              },
              {
                "service": "ContactMultiPL__c",
                "hull": "traits_salesforce_contact/contact_multi_pl",
                "overwrite": false
              },
              {
                "service": "UserSegments__c",
                "hull": "traits_salesforce_contact/user_segments",
                "overwrite": false
              },
              {
                "service": "Department",
                "hull": "traits_salesforce_contact/contact_department",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [],
            "account_claims": []
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00Q1I000004WHbtUAG"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Contact",
                    "url": "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
                  },
                  "Id": "00Q1I000004WHbtUAG",
                  "Email": "becci.blankenshield@adventure-works.com",
                  "FirstName": "Becci",
                  "LastName": "Blankenshield",
                  "Company": "Adventure Works",
                  "Website": "adventure-works.com",
                  "Status": "Open - Not Contacted",
                  "UserSegments__c": "segment3;segment1;Segment2;12;1;21",
                  "ContactMultiPL__c": ["1", "2"]
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Contact/describe")
            .reply(200, { fields: [
                {
                  name: "UserSegments__c",
                  picklistValues: [],
                  type: "multipicklist",
                  unique: false,
                  updateable: true
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated?start")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2CFirstName%2CLastName%2CId%2CAccountId%2CContactMultiPL__c%2CUserSegments__c%2CDepartment%20FROM%20Contact%20WHERE%20Id%20IN%20('00Q1I000004WHbtUAG')%20AND%20Id%20!%3D%20null"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/describe"
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "becci.blankenshield@adventure-works.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
            },
            {
              "traits": {
                "first_name": {
                  "value": "Becci",
                  "operation": "setIfNull"
                },
                "salesforce_contact/custom_first_name_field": {
                  "value": "Becci",
                  "operation": "set"
                },
                "last_name": {
                  "value": "Blankenshield",
                  "operation": "setIfNull"
                },
                "salesforce_contact/last_name": {
                  "value": "Blankenshield",
                  "operation": "set"
                },
                "salesforce_contact/user_email": {
                  "value": "becci.blankenshield@adventure-works.com",
                  "operation": "set"
                },
                "salesforce_contact/contact_multi_pl": {
                  "value": [
                    "1",
                    "2"
                  ],
                  "operation": "set"
                },
                "salesforce_contact/user_segments": {
                  "value": [
                    "1",
                    "12",
                    "21",
                    "segment1",
                    "Segment2",
                    "segment3"
                  ],
                  "operation": "set"
                },
                "salesforce_contact/id": {
                  "value": "00Q1I000004WHbtUAG",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "becci.blankenshield@adventure-works.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Becci",
                "operation": "setIfNull"
              },
              "salesforce_contact/custom_first_name_field": {
                "value": "Becci",
                "operation": "set"
              },
              "last_name": {
                "value": "Blankenshield",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "Blankenshield",
                "operation": "set"
              },
              "salesforce_contact/user_email": {
                "value": "becci.blankenshield@adventure-works.com",
                "operation": "set"
              },
              "salesforce_contact/contact_multi_pl": {
                "value": [
                  "1",
                  "2"
                ],
                "operation": "set"
              },
              "salesforce_contact/user_segments": {
                "value": [
                  "1",
                  "12",
                  "21",
                  "segment1",
                  "Segment2",
                  "segment3"
                ],
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "00Q1I000004WHbtUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch a contact and link to an account", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-contacts",
        connector: {
          private_settings: {
            ...private_settings,
            "lead_synchronized_segments": [
              "5a0c1f07b4d8644425002c65"
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
              }
            ],
            "fetch_accounts": true,
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
                "service": "FirstName",
                "hull": "traits_salesforce_contact/first_name",
                "overwrite": false
              },
              {
                "service": "LastName",
                "hull": "traits_salesforce_contact/last_name",
                "overwrite": false
              },
              {
                "service": "Email",
                "hull": "traits_salesforce_contact/email",
                "overwrite": false
              },
              {
                "service": "ContactMultiPL__c",
                "hull": "traits_salesforce_contact/contact_multi_pl",
                "overwrite": false
              },
              {
                "service": "Department",
                "hull": "traits_salesforce_contact/contact_department",
                "overwrite": false
              }
            ],
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "salesforce/website",
                "overwrite": false
              }
            ],
            "link_accounts": true,
            "account_claims": [
              {
                "hull": "domain",
                "service": "Website",
                "required": true
              },
              {
                "hull": "external_id",
                "service": "CustomField1",
                "required": false
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00Q1I000004WHbtUAG"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Contact");
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Contact",
                    url: "/services/data/v39.0/sobjects/Contact/00Q1I000004WHbtUAG"
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
                      url: "/services/data/v39.0/sobjects/Account/0011I000007Cy18QAC"
                    },
                    Id: "0011I000007Cy18QAC",
                    Website: "krakowtraders.pl",
                    Name: "Krakow Trades",
                    Mrr__c: 950
                  }
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated?start=")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2CFirstName%2CLastName%2CId%2CAccountId%2CContactMultiPL__c%2CDepartment%20FROM%20Contact%20WHERE%20Id%20IN%20('00Q1I000004WHbtUAG')%20AND%20Id%20!%3D%20null"
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "becci.blankenshield@adventure-works.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
            },
            {
              "traits": {
                "first_name": {
                  "value": "Becci",
                  "operation": "setIfNull"
                },
                "salesforce_contact/first_name": {
                  "value": "Becci",
                  "operation": "set"
                },
                "last_name": {
                  "value": "Blankenshield",
                  "operation": "setIfNull"
                },
                "salesforce_contact/last_name": {
                  "value": "Blankenshield",
                  "operation": "set"
                },
                "salesforce_contact/email": {
                  "value": "becci.blankenshield@adventure-works.com",
                  "operation": "set"
                },
                "salesforce_contact/id": {
                  "value": "00Q1I000004WHbtUAG",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.account.link.success",
            {
              "subject_type": "user",
              "user_email": "becci.blankenshield@adventure-works.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
            },
            undefined
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "becci.blankenshield@adventure-works.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
              },
              "subjectType": "user"
            },
            {
              "first_name": {
                "value": "Becci",
                "operation": "setIfNull"
              },
              "salesforce_contact/first_name": {
                "value": "Becci",
                "operation": "set"
              },
              "last_name": {
                "value": "Blankenshield",
                "operation": "setIfNull"
              },
              "salesforce_contact/last_name": {
                "value": "Blankenshield",
                "operation": "set"
              },
              "salesforce_contact/email": {
                "value": "becci.blankenshield@adventure-works.com",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "00Q1I000004WHbtUAG",
                "operation": "setIfNull"
              }
            }
          ],
          [
            "traits",
            {
              "asUser": {
                "email": "becci.blankenshield@adventure-works.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHbtUAG"
              },
              "asAccount": {
                "anonymous_id": "salesforce:0011I000007Cy18QAC"
              },
              "subjectType": "account"
            },
            {
              "salesforce/id": "0011I000007Cy18QAC"
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch contact with related entity fields", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-contacts",
        connector: {
          private_settings: {
            ...private_settings,
            "contact_attributes_inbound": [
              {
                "service": "Email",
                "hull": "traits_salesforce_contact/email",
                "overwrite": false
              },
              {
                "service": "OwnerId",
                "hull": "traits_salesforce_contact/owner_id",
                "overwrite": false
              },
              {
                "service": "Owner.Email",
                "hull": "traits_salesforce_contact/owner_email",
                "overwrite": false
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00Q1I000004WHchUAG"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Email,FirstName,LastName,Id,AccountId,OwnerId,Owner.Email FROM Contact WHERE Id IN ('00Q1I000004WHchUAG') AND Id != null";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Contact",
                    url: "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
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
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated?start=")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2CFirstName%2CLastName%2CId%2CAccountId%2COwnerId%2COwner.Email%20FROM%20Contact%20WHERE%20Id%20IN%20('00Q1I000004WHchUAG')%20AND%20Id%20!%3D%20null"
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "adam@apple.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
            },
            {
              "traits": {
                "salesforce_contact/email": {
                  "value": "adam@apple.com",
                  "operation": "set"
                },
                "salesforce_contact/owner_id": {
                  "value": "10Q1I000004WHchU",
                  "operation": "set"
                },
                "salesforce_contact/owner_email": {
                  "value": "owner@hull.com",
                  "operation": "set"
                },
                "salesforce_contact/id": {
                  "value": "00Q1I000004WHchUAG",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "adam@apple.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
              },
              "subjectType": "user"
            },
            {
              "salesforce_contact/email": {
                "value": "adam@apple.com",
                "operation": "set"
              },
              "salesforce_contact/owner_id": {
                "value": "10Q1I000004WHchU",
                "operation": "set"
              },
              "salesforce_contact/owner_email": {
                "value": "owner@hull.com",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "00Q1I000004WHchUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch a single contact with broken attribute mapper", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-contacts",
        connector: {
          private_settings: {
            ...private_settings,
            "contact_attributes_inbound": [
              {
                "service": "Email",
                "hull": "traits_salesforce_contact/email",
                "overwrite": false
              },
              {
                "service": "Owner.Email",
                "hull": "traits_salesforce_contact/owner_email",
                "overwrite": false
              },
              {
                "service": "Description",
                "hull": "",
                "overwrite": false
              },
              {
                "service": "",
                "hull": "traits_salesforce_contact/about",
                "overwrite": false
              }
            ]
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00Q1I000004WHchUAG"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Email,FirstName,LastName,Id,AccountId,Owner.Email,Description FROM Contact WHERE Id IN ('00Q1I000004WHchUAG') AND Id != null";
            })
            .reply(200, { records: [
                {
                  attributes: {
                    type: "Contact",
                    url: "/services/data/v39.0/sobjects/Contact/00Q1I000004WHchUAG"
                  },
                  Id: "00Q1I000004WHchUAG",
                  Email: "adam@apple.com",
                  OwnerId: "10Q1I000004WHchU",
                  Owner: {
                    attributes: {
                      type: "User",
                      url: "/services/data/v39.0/sobjects/User/0054P000008CIowQAG"
                    },
                    Email: "owner@hull.com"
                  }
                }
              ] }, { "sforce-limit-info": "api-usage=500/50000" });

          return scope;
        },
        response: { status : "deferred"},
        logs: [
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": expect.whatever(),
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Email%2CFirstName%2CLastName%2CId%2CAccountId%2COwner.Email%2CDescription%20FROM%20Contact%20WHERE%20Id%20IN%20('00Q1I000004WHchUAG')%20AND%20Id%20!%3D%20null"
            }
          ],
          [
            "info",
            "incoming.user.success",
            {
              "subject_type": "user",
              "user_email": "adam@apple.com",
              "user_anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
            },
            {
              "traits": {
                "salesforce_contact/email": {
                  "value": "adam@apple.com",
                  "operation": "set"
                },
                "salesforce_contact/owner_email": {
                  "value": "owner@hull.com",
                  "operation": "set"
                },
                "salesforce_contact/id": {
                  "value": "00Q1I000004WHchUAG",
                  "operation": "setIfNull"
                }
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "Incoming Data",
              "type": "webpayload"
            }
          ]
        ],
        firehoseEvents: [
          [
            "traits",
            {
              "asUser": {
                "email": "adam@apple.com",
                "anonymous_id": "salesforce-contact:00Q1I000004WHchUAG"
              },
              "subjectType": "user"
            },
            {
              "salesforce_contact/email": {
                "value": "adam@apple.com",
                "operation": "set"
              },
              "salesforce_contact/owner_email": {
                "value": "owner@hull.com",
                "operation": "set"
              },
              "salesforce_contact/id": {
                "value": "00Q1I000004WHchUAG",
                "operation": "setIfNull"
              }
            }
          ]
        ],
        metrics: [
          ["increment","connector.request",1],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });
});
