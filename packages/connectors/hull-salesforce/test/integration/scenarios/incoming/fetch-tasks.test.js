// @flow
import connectorConfig from "../../../../server/config";

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
  fetch_tasks: true,
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
}

describe("Fetch Tasks Tests", () => {

  it("should fetch multiple tasks", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch",
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
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "website",
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
            .get("/services/data/v39.0/sobjects/Lead/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: [] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: [] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Task/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00TP0000", "00TP0001"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q.match("FROM Task");
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Task",
                    "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                  },
                  "Id": "00TP0000",
                  "Subject": "Send Letter",
                  "WhoId": "034PvQAH",
                  "AccountId": "14P26SCAbQA",
                  "CreatedDate": "2019-07-01T13:16:20.000+0000",
                  "Who": {
                    "attributes": {
                      "type": "Name",
                      "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                    },
                    "Type": "Contact"
                  }
                },
                {
                  "attributes": {
                    "type": "Task",
                    "url": "/services/data/v39.0/sobjects/Task/00TP0001"
                  },
                  "Id": "00TP0001",
                  "Subject": "Send Quote",
                  "WhoId": "034PvQAH",
                  "AccountId": "14P26SCAbQA",
                  "CreatedDate": "2019-07-01T13:16:20.000+0000",
                  "Who": {
                    "attributes": {
                      "type": "Name",
                      "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                    },
                    "Type": "Contact"
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
              "jobName": "fetchChanges",
              "type": "Lead",
              "fetchFields": [
                "Email",
                "FirstName",
                "LastName",
                "Id",
                "ConvertedAccountId",
                "ConvertedContactId",
                "Company",
                "Website"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 147,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Lead/updated?")
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Lead"
            }
          ],
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Contact",
              "fetchFields": [
                "Email",
                "FirstName",
                "LastName",
                "Id",
                "AccountId"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 150,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated?")
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Contact"
            }
          ],
          [
            "debug",
            "Fetch Accounts not turned on. Skipping account fetch",
            {},
            undefined
          ],
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Task",
              "fetchFields": [
                "Id",
                "Subject",
                "WhoId",
                "Status",
                "AccountId",
                "CreatedDate",
                "IsArchived",
                "OwnerId",
                "CallDurationInSeconds",
                "CallObject",
                "CallDisposition",
                "CallType",
                "IsClosed",
                "Description",
                "IsRecurrence",
                "CreatedById",
                "IsDeleted",
                "ActivityDate",
                "RecurrenceEndDateOnly",
                "IsHighPriority",
                "LastModifiedById",
                "LastModifiedDate",
                "Priority",
                "RecurrenceActivityId",
                "RecurrenceDayOfMonth",
                "RecurrenceDayOfWeekMask",
                "RecurrenceInstance",
                "RecurrenceInterval",
                "RecurrenceMonthOfYear",
                "RecurrenceTimeZoneSidKey",
                "RecurrenceType",
                "WhatId",
                "ReminderDateTime",
                "IsReminderSet",
                "RecurrenceRegeneratedType",
                "RecurrenceStartDateOnly",
                "Type"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 147,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Task/updated?")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 738,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Id%2CSubject%2CWhoId%2CStatus%2CAccountId%2CCreatedDate%2CIsArchived%2COwnerId%2CCallDurationInSeconds%2CCallObject%2CCallDisposition%2CCallType%2CIsClosed%2CDescription%2CIsRecurrence%2CCreatedById%2CIsDeleted%2CActivityDate%2CRecurrenceEndDateOnly%2CIsHighPriority%2CLastModifiedById%2CLastModifiedDate%2CPriority%2CRecurrenceActivityId%2CRecurrenceDayOfMonth%2CRecurrenceDayOfWeekMask%2CRecurrenceInstance%2CRecurrenceInterval%[...]1')"
            }
          ],
          [
            "info",
            "incoming.event.success",
            {
              "subject_type": "user",
              "user_anonymous_id": "salesforce-contact:034PvQAH"
            },
            {
              "event": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0000",
                "Subject": "Send Letter",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000"
              }
            }
          ],
          [
            "info",
            "incoming.event.success",
            {
              "subject_type": "user",
              "user_anonymous_id": "salesforce-contact:034PvQAH"
            },
            {
              "event": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0001"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0001",
                "Subject": "Send Quote",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000"
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Task"
            }
          ]
        ],
        firehoseEvents: [
          [
            "track",
            {
              "asUser": {
                "anonymous_id": "salesforce-contact:034PvQAH"
              },
              "subjectType": "user"
            },
            {
              "ip": null,
              "url": null,
              "referer": null,
              "source": "salesforce",
              "created_at": "2019-07-01T13:16:20.000+0000",
              "event_id": "salesforce-task:00TP0000",
              "properties": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0000",
                "Subject": "Send Letter",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000"
              },
              "event": "Salesforce Task"
            }
          ],
          [
            "track",
            {
              "asUser": {
                "anonymous_id": "salesforce-contact:034PvQAH"
              },
              "subjectType": "user"
            },
            {
              "ip": null,
              "url": null,
              "referer": null,
              "source": "salesforce",
              "created_at": "2019-07-01T13:16:20.000+0000",
              "event_id": "salesforce-task:00TP0001",
              "properties": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0001"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0001",
                "Subject": "Send Quote",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000"
              },
              "event": "Salesforce Task"
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
          ["increment","ship.service_api.call",1],
          ["value","ship.service_api.limit",50000],
          ["value","ship.service_api.remaining",49500],
          ["increment","ship.incoming.users",2]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch a single task", () => {
    return testScenario({ connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch",
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
            "account_attributes_inbound": [
              {
                "service": "Website",
                "hull": "website",
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
            .get("/services/data/v39.0/sobjects/Lead/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: [] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Contact/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: [] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/sobjects/Task/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00TP0000"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Id,Subject,WhoId,Status,AccountId,CreatedDate,IsArchived,OwnerId," +
                "CallDurationInSeconds,CallObject,CallDisposition,CallType,IsClosed,Description,IsRecurrence,CreatedById," +
                "IsDeleted,ActivityDate,RecurrenceEndDateOnly,IsHighPriority,LastModifiedById,LastModifiedDate,Priority," +
                "RecurrenceActivityId,RecurrenceDayOfMonth,RecurrenceDayOfWeekMask,RecurrenceInstance,RecurrenceInterval," +
                "RecurrenceMonthOfYear,RecurrenceTimeZoneSidKey,RecurrenceType,WhatId,ReminderDateTime,IsReminderSet," +
                "RecurrenceRegeneratedType,RecurrenceStartDateOnly,Type,Who.Type FROM Task WHERE Id IN ('00TP0000')";
            })
            .reply(200, { records: [
                {
                  "attributes": {
                    "type": "Task",
                    "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                  },
                  "Id": "00TP0000",
                  "Subject": "Send Letter",
                  "WhoId": "034PvQAH",
                  "AccountId": "14P26SCAbQA",
                  "CreatedDate": "2019-07-01T13:16:20.000+0000",
                  "Type": "Email",
                  "Who": {
                    "attributes": {
                      "type": "Name",
                      "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                    },
                    "Type": "Contact"
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
              "jobName": "fetchChanges",
              "type": "Lead",
              "fetchFields": [
                "Email",
                "FirstName",
                "LastName",
                "Id",
                "ConvertedAccountId",
                "ConvertedContactId",
                "Company",
                "Website"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 147,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Lead/updated?")
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Lead"
            }
          ],
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Contact",
              "fetchFields": [
                "Email",
                "FirstName",
                "LastName",
                "Id",
                "AccountId"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 150,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Contact/updated?")
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Contact"
            }
          ],
          [
            "debug",
            "Fetch Accounts not turned on. Skipping account fetch",
            {},
            undefined
          ],
          [
            "info",
            "incoming.job.start",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Task",
              "fetchFields": [
                "Id",
                "Subject",
                "WhoId",
                "Status",
                "AccountId",
                "CreatedDate",
                "IsArchived",
                "OwnerId",
                "CallDurationInSeconds",
                "CallObject",
                "CallDisposition",
                "CallType",
                "IsClosed",
                "Description",
                "IsRecurrence",
                "CreatedById",
                "IsDeleted",
                "ActivityDate",
                "RecurrenceEndDateOnly",
                "IsHighPriority",
                "LastModifiedById",
                "LastModifiedDate",
                "Priority",
                "RecurrenceActivityId",
                "RecurrenceDayOfMonth",
                "RecurrenceDayOfWeekMask",
                "RecurrenceInstance",
                "RecurrenceInterval",
                "RecurrenceMonthOfYear",
                "RecurrenceTimeZoneSidKey",
                "RecurrenceType",
                "WhatId",
                "ReminderDateTime",
                "IsReminderSet",
                "RecurrenceRegeneratedType",
                "RecurrenceStartDateOnly",
                "Type"
              ],
              "identMapping": [
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
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 147,
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Task/updated")
            }
          ],
          [
            "debug",
            "ship.service_api.request",
            {},
            {
              "method": "GET",
              "url_length": 725,
              "url": "https://na98.salesforce.com/services/data/v39.0/query?q=SELECT%20Id%2CSubject%2CWhoId%2CStatus%2CAccountId%2CCreatedDate%2CIsArchived%2COwnerId%2CCallDurationInSeconds%2CCallObject%2CCallDisposition%2CCallType%2CIsClosed%2CDescription%2CIsRecurrence%2CCreatedById%2CIsDeleted%2CActivityDate%2CRecurrenceEndDateOnly%2CIsHighPriority%2CLastModifiedById%2CLastModifiedDate%2CPriority%2CRecurrenceActivityId%2CRecurrenceDayOfMonth%2CRecurrenceDayOfWeekMask%2CRecurrenceInstance%2CRecurrenceInterval%[...]0')"
            }
          ],
          [
            "info",
            "incoming.event.success",
            {
              "subject_type": "user",
              "user_anonymous_id": "salesforce-contact:034PvQAH"
            },
            {
              "event": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0000",
                "Subject": "Send Letter",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000",
                "Type": "Email"
              }
            }
          ],
          [
            "info",
            "incoming.job.success",
            {},
            {
              "jobName": "fetchChanges",
              "type": "Task"
            }
          ]
        ],
        firehoseEvents: [
          [
            "track",
            {
              "asUser": {
                "anonymous_id": "salesforce-contact:034PvQAH"
              },
              "subjectType": "user"
            },
            {
              "ip": null,
              "url": null,
              "referer": null,
              "source": "salesforce",
              "created_at": "2019-07-01T13:16:20.000+0000",
              "event_id": "salesforce-task:00TP0000",
              "properties": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00TP0000"
                },
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00TP0000",
                "Subject": "Send Letter",
                "WhoId": "034PvQAH",
                "AccountId": "14P26SCAbQA",
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000",
                "Type": "Email"
              },
              "event": "Salesforce Task:Email"
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
