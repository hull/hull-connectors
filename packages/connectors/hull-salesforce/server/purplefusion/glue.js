/* @flow */

import { filterL } from "hull-connector-framework/src/purplefusion/language";

const defaultFields = require("../lib/default-fields.json");

const {
  route,
  set,
  get,
  ifL,
  Svc,
  moment,
  settings,
  ex,
  cast,
  cond,
  ld,
  not,
  iterateL,
  transformTo,
  input,
  filter,
  utils,
  settingsUpdate,
  hull,
  loopL,
  loopEndL,
  cacheLock
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullIncomingEvent,
  HullOutgoingEvent,
  HullIncomingUser,
  HullIncomingAccount
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  SalesforceAccountRead,
  SalesforceLeadRead,
  SalesforceContactRead,
  SalesforceTaskRead,
  SalesforceTaskWrite
} = require("./service-objects");

function salesforce(op: string, param?: any): Svc {
  return new Svc({ name: "salesforce", op }, param);
}

function salesforceSyncAgent(op: string, param?: any): Svc {
  return new Svc({ name: "salesforce_service", op }, param);
}

const glue = {
  ensureHook: [set("service_name", "salesforce")],
  refreshToken: [],
  userUpdate: [
    salesforceSyncAgent("userUpdate", { messages: input() }),
    route("sendEvents")
  ],
  leadUpdate: [
    salesforceSyncAgent("leadUpdate", { messages: input() }),
    route("sendEvents")
  ],
  accountUpdate: [salesforceSyncAgent("accountUpdate", { messages: input() })],

  getFetchFields: [
    set(
      "defaultFetchFields",
      ld("map", ld("get", defaultFields, "${service_type}"), "service")
    ),
    set(
      "attributeMappingKey",
      ld("toLower", "${service_type}_attributes_inbound")
    ),

    set(
      "identityClaims",
      ld("compact", ld("map", settings("${service_type}_claims"), "service"))
    ),
    set(
      "settingsFetchFields",
      ld("compact", ld("map", settings("${attributeMappingKey}"), "service"))
    ),

    set(
      "fetchFields",
      ld(
        "uniq",
        ld(
          "concat",
          "${identityClaims}",
          "${defaultFetchFields}",
          "${settingsFetchFields}"
        )
      )
    ),

    ifL(
      [
        cond("isEqual", "${service_type}", "Task"),
        not(ld("isNil", settings("salesforce_external_id")))
      ],
      [
        set(
          "fetchFields",
          ld("concat", "${fetchFields}", settings("salesforce_external_id"))
        )
      ]
    )
  ],

  /*
  Incoming Account Handling
   */
  fetchAllAccounts: [
    cacheLock("fetch-all-accounts", [
      set("service_type", "account"),
      set("transform_to", SalesforceAccountRead),
      route("prepareFetchAll"),
      route("fetchStandard")
    ])
  ],
  fetchRecentAccounts: ifL(cond("isEqual", settings("fetch_accounts"), true), [
    cacheLock("fetch-recent-accounts", [
      set("service_type", "account"),
      set("transform_to", SalesforceAccountRead),
      route("prepareFetchRecent"),
      route("fetchStandard")
    ])
  ]),

  /*
  Incoming Lead Handling
   */
  fetchAllLeads: [
    cacheLock("fetch-all-leads", [
      set("service_type", "lead"),
      set("transform_to", SalesforceLeadRead),
      route("prepareFetchAll"),
      route("fetchStandard")
    ])
  ],
  fetchRecentLeads: ifL(cond("isEqual", settings("fetch_leads"), true), [
    cacheLock("fetch-recent-leads", [
      set("service_type", "lead"),
      set("transform_to", SalesforceLeadRead),
      route("prepareFetchRecent"),
      route("fetchStandard")
    ])
  ]),

  /*
  Incoming Contact Handling
   */
  fetchAllContacts: [
    cacheLock("fetch-all-contacts", [
      set("service_type", "contact"),
      set("transform_to", SalesforceContactRead),
      route("prepareFetchAll"),
      route("fetchStandard")
    ])
  ],
  fetchRecentContacts: ifL(cond("isEqual", settings("fetch_contacts"), true), [
    cacheLock("fetch-recent-contacts", [
      set("service_type", "contact"),
      set("transform_to", SalesforceContactRead),
      route("prepareFetchRecent"),
      route("fetchStandard")
    ])
  ]),

  /*
  Fetch Utils
   */
  prepareFetchAll: [
    route("getFetchFields"),
    set(
      "soqlQuery",
      salesforceSyncAgent("getFetchSoqlQuery", {
        sfType: "${service_type}",
        fields: "${fetchFields}"
      })
    )
  ],
  prepareFetchRecent: [
    route("getFetchFields"),
    set("lastFetchedAt", settings("${service_type}s_last_fetched_timestamp")),

    ifL(cond("isEmpty", "${lastFetchedAt}"), [
      set(
        "lastFetchedAt",
        ex(ex(moment(), "subtract", { minutes: 10 }), "valueOf")
      )
    ]),
    set("stopFetchAt", ex(moment(), "valueOf")),
    ifL(
      cond("isEqual", "${service_type}", "contact"),
      settingsUpdate({ contacts_last_fetched_timestamp: "${stopFetchAt}" })
    ),
    ifL(
      cond("isEqual", "${service_type}", "lead"),
      settingsUpdate({ leads_last_fetched_timestamp: "${stopFetchAt}" })
    ),
    ifL(
      cond("isEqual", "${service_type}", "account"),
      settingsUpdate({ accounts_last_fetched_timestamp: "${stopFetchAt}" })
    ),

    set(
      "soqlQuery",
      salesforceSyncAgent("getFetchSoqlQuery", {
        sfType: "${service_type}",
        fields: "${fetchFields}",
        fetchDaysBack: "${fetchDaysBack}",
        lastFetchedAt: "${lastFetchedAt}"
      })
    )
  ],
  fetchStandard: [
    ifL(cond("isEqual", "${service_type}", "account"), {
      do: set("incoming_action", "asAccount"),
      eldo: set("incoming_action", "asUser")
    }),
    loopL([
      set(
        "page",
        salesforceSyncAgent("executeSoqlQuery", {
          query: "${soqlQuery}",
          nextRecordsUrl: "${nextPage}"
        })
      ),
      set("records", "${page.records}"),
      set("nextPage", "${page.nextRecordsUrl}"),
      set("done", "${page.done}"),

      iterateL("${records}", { key: "record", async: true }, [
        hull("${incoming_action}", cast("${transform_to}", "${record}"))
      ]),
      ifL(cond("isEqual", "${done}", true), loopEndL())
    ])
  ],

  /*
  Task Handling
   */
  fetchRecentTasks: ifL(cond("isEqual", settings("fetch_tasks"), true), [
    set("fetchType", "Task"),
    route("getFetchFields"),
    set("lastFetchedAt", settings("events_last_fetched_timestamp")),
    ifL(cond("isEmpty", "${lastFetchedAt}"), [
      set(
        "lastFetchedAt",
        ex(ex(moment(), "subtract", { minutes: 10 }), "valueOf")
      )
    ]),
    set("stopFetchAt", ex(moment(), "valueOf")),
    settingsUpdate({ events_last_fetched_timestamp: "${stopFetchAt}" }),
    set(
      "soqlQuery",
      salesforceSyncAgent("getFetchSoqlQuery", {
        sfType: "${fetchType}",
        fields: "${fetchFields}",
        fetchDaysBack: "${fetchDaysBack}",
        lastFetchedAt: "${lastFetchedAt}"
      })
    ),
    route("fetchTasks")
  ]),
  fetchAllTasks: [
    set("fetchType", "Task"),
    route("getFetchFields"),
    set("stopFetchAt", ex(moment(), "valueOf")),
    settingsUpdate({ events_last_fetched_timestamp: "${stopFetchAt}" }),
    set(
      "soqlQuery",
      salesforceSyncAgent("getFetchSoqlQuery", {
        sfType: "${fetchType}",
        fields: "${fetchFields}"
      })
    ),
    route("fetchTasks")
  ],
  fetchTasks: [
    loopL([
      set(
        "page",
        salesforceSyncAgent("executeSoqlQuery", {
          query: "${soqlQuery}",
          nextRecordsUrl: "${nextPage}"
        })
      ),
      set("records", "${page.records}"),
      set("nextPage", "${page.nextRecordsUrl}"),
      set("done", "${page.done}"),

      iterateL("${records}", { key: "record", async: true }, [
        ifL(
          cond("isEqual", "${record.IsDeleted}", true),
          set("deletedPrefix", "DELETED - ")
        ),
        ifL(cond("notEmpty", "${record.Type}"), {
          do: set("eventName", "Salesforce Task:${record.Type}"),
          eldo: set("eventName", "Salesforce Task")
        }),
        set("identityPrefix", ld("toLower", "salesforce-${record.Who.Type}")),
        hull("asUser", {
          ident: {
            anonymous_id: "${identityPrefix}:${record.WhoId}"
          },
          events: [
            transformTo(
              HullIncomingEvent,
              cast(SalesforceTaskRead, "${record}")
            )
          ]
        })
      ]),
      ifL(cond("isEqual", "${done}", true), loopEndL())
    ])
  ],

  sendEvents: [
    set("identifierKey", settings("salesforce_external_id")),
    ifL(
      cond("allTrue", [
        cond("isEqual", settings("send_outgoing_tasks"), true),
        cond("notEmpty", settings("hull_event_id")),
        cond("notEmpty", "${identifierKey}")
      ]),
      [
        iterateL(input(), { key: "message", async: true }, [
          set("hullEvents", get("events", "${message}")),
          set(
            "whiteListedEventNames",
            ld("map", settings("events_mapping"), "event")
          ),
          set("resourceType", "Task"),
          set("whiteListedEventIds", utils("emptyArray")),
          set("taskEnvelopes", utils("emptyArray")),

          iterateL("${hullEvents}", { key: "hullEvent", async: true }, [
            set("hullEventName", get("event", "${hullEvent}")),

            ifL(
              ld("includes", "${whiteListedEventNames}", "${hullEventName}"),
              [
                set(
                  "taskType",
                  get(
                    "[0].task_type",
                    filter(
                      { event: "${hullEventName}" },
                      settings("events_mapping")
                    )
                  )
                ),
                set(
                  "outgoingEvent",
                  cast(HullOutgoingEvent, {
                    user: "${message.user}",
                    account: "${message.account}",
                    event: "${hullEvent}"
                  })
                ),
                set(
                  "transformedTask",
                  transformTo(SalesforceTaskWrite, "${outgoingEvent}")
                ),
                ex("${taskEnvelopes}", "push", {
                  hullEvent: "${hullEvent}",
                  transformedTask: "${transformedTask}"
                }),
                ex(
                  "${whiteListedEventIds}",
                  "push",
                  get("event_id", "${hullEvent}")
                )
              ]
            )
          ]),

          ifL(cond("notEmpty", "${whiteListedEventIds}"), [
            route("findTasks", "${whiteListedEventIds}"),
            route("filterOutgoingTasks", "${existingTasks}"),

            set("toInsert", get("toInsert", "${sortedTasks}")),
            set("toUpdate", get("toUpdate", "${sortedTasks}")),

            // Send to salesforce
            set(
              "tasksInserted",
              salesforceSyncAgent("insertRecords", {
                records: "${toInsert}",
                resource: "Task"
              })
            ),
            set(
              "tasksUpdated",
              salesforceSyncAgent("updateRecords", {
                records: "${toUpdate}",
                resource: "Task"
              })
            ),

            set("records", ld("concat", "${tasksInserted}", "${tasksUpdated}")),
            set("errors", filter({ success: false }, "${records}")),
            set("successes", filter({ success: true }, "${records}")),

            salesforceSyncAgent("logOutgoing", {
              status: "success",
              records: "${successes}",
              identity: "${message.user}",
              hullType: "event"
            }),
            salesforceSyncAgent("logOutgoing", {
              status: "error",
              records: "${errors}",
              identity: "${message.user}",
              hullType: "event"
            })
          ])
        ])
      ]
    )
  ],
  findTasks: [
    set("event_ids", input()),
    set(
      "existingTasks",
      salesforceSyncAgent("querySalesforceRecords", {
        sfType: "Task",
        identifierKey: "${identifierKey}",
        event_ids: "${event_ids}"
      })
    )
  ],
  filterOutgoingTasks: [
    set("${existingTasks}", input()),
    set("toInsert", utils("emptyArray")),
    set("toUpdate", utils("emptyArray")),

    set("transformedTasks", ld("map", "${taskEnvelopes}", "transformedTask")),
    iterateL("${transformedTasks}", { key: "transformedTask", async: false }, [
      set(
        "existingTask",
        filter(
          { "${identifierKey}": get("${identifierKey}", "${transformedTask}") },
          "${existingTasks}"
        )
      ),

      ifL(cond("notEmpty", "${existingTask}"), {
        do: [
          set("existingId", get("Id", "${existingTask}")),
          ld("set", "${transformedTask}", "Id", "${existingId}"),
          ex("${toUpdate}", "push", "${transformedTask}")
        ],
        eldo: ex("${toInsert}", "push", "${transformedTask}")
      })
    ]),
    set("sortedTasks", { toInsert: "${toInsert}", toUpdate: "${toUpdate}" })
  ],

  /*
  Handle Deleted Entities
   */
  getDeletedRecords: [
    set("fetchStart", ex(ex(moment(), "subtract", { minutes: 6 }), "valueOf")),
    set("fetchEnd", ex(moment(), "valueOf")),
    set(
      "deletedRecords",
      salesforceSyncAgent("getDeletedRecords", {
        sfType: "${fetchType}",
        fetchStart: "${fetchStart}",
        fetchEnd: "${fetchEnd}"
      })
    )
  ],
  fetchRecentDeletedTasks: ifL(cond("isEqual", settings("fetch_tasks"), true), [
    set("fetchType", "Task"),
    route("getDeletedRecords"),
    route("getFetchFields"),
    set("deletedIds", ld("map", "${deletedRecords}", "id")),
    set(
      "records",
      salesforceSyncAgent("queryAllById", {
        sfType: "${fetchType}",
        ids: "${deletedIds}",
        fields: "${fetchFields}"
      })
    ),
    iterateL("${records}", { key: "record", async: true }, [
      set("identityPrefix", ld("toLower", "salesforce-${record.Who.Type}")),
      ifL(
        cond("isEqual", "${record.IsDeleted}", true),
        set("deletedPrefix", "DELETED - ")
      ),
      ifL(cond("notEmpty", "${record.Type}"), {
        do: set("eventName", "Salesforce Task:${record.Type}"),
        eldo: set("eventName", "Salesforce Task")
      }),
      ifL(
        cond("notEmpty", "${deletedPrefix}"),
        set("eventName", "${deletedPrefix}${eventName}")
      ),

      hull("asUser", {
        ident: {
          anonymous_id: "${identityPrefix}:${record.WhoId}"
        },
        events: [
          transformTo(HullIncomingEvent, cast(SalesforceTaskRead, "${record}"))
        ]
      })
    ])
  ]),
  fetchRecentDeletedEntities: [
    route("getDeletedRecords"),
    ifL(cond("notEmpty", "${deletedRecords}"), [
      route("importDeletedEntities"),
      route("handleMergedSfObjects")
    ])
  ],
  importDeletedEntities: [
    iterateL(
      "${deletedRecords}",
      "deletedRecord",
      hull(
        "${deletedOp}",
        cast("${incoming_type}", {
          ident: {
            anonymous_id: "${anon_id_prefix}:${deletedRecord.id}"
          },
          attributes: {
            "${service_name}/deleted_at": "${deletedRecord.deletedDate}"
          }
        })
      )
    )
  ],
  handleMergedSfObjects: [
    set("deletedIds", ld("map", "${deletedRecords}", "id")),

    // TODO WHERE MasterRecordId != null
    set(
      "deletedRawRecords",
      salesforceSyncAgent("queryAllById", {
        sfType: "${fetchType}",
        ids: "${deletedIds}",
        fields: ["MasterRecordId"]
      })
    ),
    set("masterRecordIds", ld("map", "${deletedRawRecords}", "MasterRecordId")),
    ifL(cond("notEmpty", "${masterRecordIds}"), [
      set(
        "masterRecords",
        salesforceSyncAgent("queryExistingById", {
          sfType: "${fetchType}",
          ids: "${masterRecordIds}",
          fields: ["Id", "IsDeleted"]
        })
      ),

      set(
        "existingMasterRecords",
        filterL(
          cond("isEqual", ld("get", "${masterRecord}", "IsDeleted"), false),
          "masterRecord",
          "${masterRecords}"
        )
      ),

      iterateL(
        "${existingMasterRecords}",
        "existingMasterRecord",
        hull(
          "${op}",
          cast("${incoming_type}", {
            ident: {
              anonymous_id: "${anon_id_prefix}:${existingMasterRecord.Id}"
            },
            attributes: {
              "${service_name}/id": "${existingMasterRecord.Id}",
              "${service_name}/deleted_at": null
            }
          })
        )
      )
    ])
  ],
  fetchRecentDeletedContacts: ifL(
    cond("isEqual", settings("fetch_contacts"), true),
    [
      set("service_name", "salesforce_contact"),
      set("anon_id_prefix", "salesforce-contact"),
      set("fetchType", "contact"),
      route("fetchRecentDeletedUsers")
    ]
  ),
  fetchRecentDeletedLeads: ifL(cond("isEqual", settings("fetch_leads"), true), [
    set("service_name", "salesforce_lead"),
    set("anon_id_prefix", "salesforce-lead"),
    set("fetchType", "lead"),
    route("fetchRecentDeletedUsers")
  ]),
  fetchRecentDeletedUsers: [
    set("op", "asUser"),
    set("deletedOp", "userDeletedInService"),
    set("incoming_type", HullIncomingUser),
    route("fetchRecentDeletedEntities")
  ],
  fetchRecentDeletedAccounts: ifL(
    cond("isEqual", settings("fetch_accounts"), true),
    [
      set("op", "asAccount"),
      set("deletedOp", "accountDeletedInService"),
      set("incoming_type", HullIncomingAccount),
      set("service_name", "salesforce"),
      set("anon_id_prefix", "salesforce"),
      set("fetchType", "account"),
      route("fetchRecentDeletedEntities")
    ]
  )
};

module.exports = glue;
