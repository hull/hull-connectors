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
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-tasks",
        connector: {
          private_settings: {
            ...private_settings,
            salesforce_external_id: "EventExternalId__c",
            "lead_claims": [],
            "user_claims": [
              { "hull": "email", "service": "Email", "required": true }
            ],
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Task/updated")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, { ids: ["00TP0000", "00TP0001"] }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/query")
            .query((query) => {
              return query.q && query.q === "SELECT Id,Subject,WhoId,Status,AccountId,CreatedDate,IsArchived,OwnerId,CallDurationInSeconds,CallObject,CallDisposition,CallType,IsClosed,Description,IsRecurrence,CreatedById,IsDeleted,ActivityDate,RecurrenceEndDateOnly,IsHighPriority,LastModifiedById,LastModifiedDate,Priority,RecurrenceActivityId,RecurrenceDayOfMonth,RecurrenceDayOfWeekMask,RecurrenceInstance,RecurrenceInterval,RecurrenceMonthOfYear,RecurrenceTimeZoneSidKey,RecurrenceType,WhatId,ReminderDateTime,IsReminderSet,RecurrenceRegeneratedType,RecurrenceStartDateOnly,Type,EventExternalId__c,Who.Type FROM Task WHERE Id IN ('00TP0000','00TP0001') AND Id != null"
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
                  "EventExternalId__c": "1234",
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
                  "EventExternalId__c": "567890",
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
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Task/updated?")
            }
          ],
          ["debug", "ship.service_api.request", {}, { "method": "GET", "url_length": expect.whatever(), "url": expect.whatever() }],
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
                "EventExternalId__c": "1234",
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
                "EventExternalId__c": "567890",
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
              "jobName": "Incoming Data",
              "type": "webpayload"
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
                "EventExternalId__c": "1234"
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
                "CreatedDate_at": "2019-07-01T13:16:20.000+0000",
                "EventExternalId__c": "567890"
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
          ["increment","ship.incoming.users",2]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch a single task", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-tasks",
        connector: {
          private_settings
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

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
                "RecurrenceRegeneratedType,RecurrenceStartDateOnly,Type,Who.Type FROM Task WHERE Id IN ('00TP0000') AND Id != null";
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
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Task/updated")
            }
          ],
          ["debug", "ship.service_api.request", {}, { "method": "GET", "url_length": expect.whatever(), "url": expect.whatever() }],
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
              "jobName": "Incoming Data",
              "type": "webpayload"
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
          ["increment","ship.incoming.users",1]
        ],
        platformApiCalls: []
      };
    });
  });

  it("should fetch deleted tasks", () => {
    return testScenario({ manifest, connectorConfig }, ({ handlers, nock, expect }) => {
      return {
        handlerType: handlers.scheduleHandler,
        handlerUrl: "fetch-recent-deleted-tasks",
        connector: {
          private_settings: {
            ...private_settings,
            salesforce_external_id: "EventExternalId__c"
          }
        },
        usersSegments: [],
        accountsSegments: [],
        externalApiMock: () => {
          const scope = nock("https://na98.salesforce.com");

          scope
            .get("/services/data/v39.0/sobjects/Task/deleted")
            .query((query) => {
              return query.start && query.end;
            })
            .reply(200, {
              deletedRecords: [
                {
                  deletedDate: "2020-06-25T17:24:57.000+0000",
                  id: "00T4P000056lb85UAA"
                }
              ],
              earliestDateAvailable: "2020-04-02T19:55:00.000+0000",
              latestDateCovered: "2020-06-25T18:03:00.000+0000"
            }, { "sforce-limit-info": "api-usage=500/50000" });

          scope
            .get("/services/data/v39.0/queryAll")
            .query((query) => {
              return query.q && query.q === "SELECT Id,Subject,WhoId,Status,AccountId,CreatedDate,IsArchived,OwnerId," +
                "CallDurationInSeconds,CallObject,CallDisposition,CallType,IsClosed,Description,IsRecurrence,CreatedById," +
                "IsDeleted,ActivityDate,RecurrenceEndDateOnly,IsHighPriority,LastModifiedById,LastModifiedDate,Priority," +
                "RecurrenceActivityId,RecurrenceDayOfMonth,RecurrenceDayOfWeekMask,RecurrenceInstance,RecurrenceInterval," +
                "RecurrenceMonthOfYear,RecurrenceTimeZoneSidKey,RecurrenceType,WhatId,ReminderDateTime,IsReminderSet," +
                "RecurrenceRegeneratedType,RecurrenceStartDateOnly,Type,EventExternalId__c,Who.Type FROM Task WHERE Id IN ('00T4P000056lb85UAA') AND Id != null";
            })
            .reply(200, { records: [
                { attributes:
                    { type: 'Task',
                      url: '/services/data/v39.0/sobjects/Task/00T4P000056lb85UAA' },
                  Id: '00T4P000056lb85UAA',
                  Subject: 'Email',
                  WhoId: "034PvQAH",
                  Status: 'In Progress',
                  AccountId: null,
                  CreatedDate: '2020-06-25T17:22:17.000+0000',
                  EventExternalId__c: "1234",
                  IsArchived: false,
                  OwnerId: '0054P000008CIowQAG',
                  CallDurationInSeconds: null,
                  CallObject: null,
                  CallDisposition: null,
                  CallType: null,
                  IsClosed: false,
                  Description: null,
                  IsRecurrence: false,
                  CreatedById: '0054P000008CIowQAG',
                  IsDeleted: true,
                  ActivityDate: '2020-06-27',
                  RecurrenceEndDateOnly: null,
                  IsHighPriority: false,
                  LastModifiedById: '0054P000008CIowQAG',
                  LastModifiedDate: '2020-06-25T17:24:57.000+0000',
                  Priority: 'Normal',
                  RecurrenceActivityId: null,
                  RecurrenceDayOfMonth: null,
                  RecurrenceDayOfWeekMask: null,
                  RecurrenceInstance: null,
                  RecurrenceInterval: null,
                  RecurrenceMonthOfYear: null,
                  RecurrenceTimeZoneSidKey: null,
                  RecurrenceType: null,
                  WhatId: null,
                  ReminderDateTime: null,
                  IsReminderSet: false,
                  RecurrenceRegeneratedType: null,
                  RecurrenceStartDateOnly: null,
                  Type: null,
                  Who: {
                    "attributes": {
                      "type": "Name",
                      "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                    },
                    "Type": "Contact"
                  },
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
              "url": expect.stringContaining("https://na98.salesforce.com/services/data/v39.0/sobjects/Task/deleted")
            }
          ],
          ["debug", "ship.service_api.request", {}, { "method": "GET", "url_length": expect.whatever(), "url": expect.whatever() }],
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
                  "url": "/services/data/v39.0/sobjects/Task/00T4P000056lb85UAA"
                },
                "AccountId": null,
                "IsArchived": false,
                "CallDurationInSeconds": null,
                "CallObject": null,
                "CallDisposition": null,
                "CallType": null,
                "IsClosed": false,
                "Description": null,
                "EventExternalId__c": "1234",
                "IsRecurrence": false,
                "RecurrenceEndDateOnly": null,
                "IsHighPriority": false,
                "RecurrenceActivityId": null,
                "RecurrenceDayOfMonth": null,
                "RecurrenceDayOfWeekMask": null,
                "RecurrenceInstance": null,
                "RecurrenceInterval": null,
                "RecurrenceMonthOfYear": null,
                "RecurrenceTimeZoneSidKey": null,
                "RecurrenceType": null,
                "WhatId": null,
                "ReminderDateTime": null,
                "IsReminderSet": false,
                "RecurrenceRegeneratedType": null,
                "RecurrenceStartDateOnly": null,
                "Type": null,
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00T4P000056lb85UAA",
                "Subject": "Email",
                "WhoId": "034PvQAH",
                "Status": "In Progress",
                "CreatedDate_at": "2020-06-25T17:22:17.000+0000",
                "OwnerId": "0054P000008CIowQAG",
                "CreatedById": "0054P000008CIowQAG",
                "IsDeleted": true,
                "ActivityDate_at": "2020-06-27",
                "LastModifiedById": "0054P000008CIowQAG",
                "LastModifiedDate_at": "2020-06-25T17:24:57.000+0000",
                "Priority": "Normal"
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
              "created_at": "2020-06-25T17:22:17.000+0000",
              "event_id": "salesforce-task:00T4P000056lb85UAA",
              "properties": {
                "attributes": {
                  "type": "Task",
                  "url": "/services/data/v39.0/sobjects/Task/00T4P000056lb85UAA"
                },
                "AccountId": null,
                "IsArchived": false,
                "CallDurationInSeconds": null,
                "CallObject": null,
                "CallDisposition": null,
                "CallType": null,
                "IsClosed": false,
                "Description": null,
                "EventExternalId__c": "1234",
                "IsRecurrence": false,
                "RecurrenceEndDateOnly": null,
                "IsHighPriority": false,
                "RecurrenceActivityId": null,
                "RecurrenceDayOfMonth": null,
                "RecurrenceDayOfWeekMask": null,
                "RecurrenceInstance": null,
                "RecurrenceInterval": null,
                "RecurrenceMonthOfYear": null,
                "RecurrenceTimeZoneSidKey": null,
                "RecurrenceType": null,
                "WhatId": null,
                "ReminderDateTime": null,
                "IsReminderSet": false,
                "RecurrenceRegeneratedType": null,
                "RecurrenceStartDateOnly": null,
                "Type": null,
                "Who": {
                  "attributes": {
                    "type": "Name",
                    "url": "/services/data/v39.0/sobjects/Contact/034PvQAH"
                  },
                  "Type": "Contact"
                },
                "Id": "00T4P000056lb85UAA",
                "Subject": "Email",
                "WhoId": "034PvQAH",
                "Status": "In Progress",
                "CreatedDate_at": "2020-06-25T17:22:17.000+0000",
                "OwnerId": "0054P000008CIowQAG",
                "CreatedById": "0054P000008CIowQAG",
                "IsDeleted": true,
                "ActivityDate_at": "2020-06-27",
                "LastModifiedById": "0054P000008CIowQAG",
                "LastModifiedDate_at": "2020-06-25T17:24:57.000+0000",
                "Priority": "Normal"
              },
              "event": "DELETED - Salesforce Task"
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
