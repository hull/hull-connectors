/* @flow */

const defaultFields = require("../lib/default-fields.json");

const {
  route,
  set,
  ifL,
  Svc,
  moment,
  settings,
  ex,
  cond,
  ld,
  not
} = require("hull-connector-framework/src/purplefusion/language");

function salesforce(op: string, param?: any): Svc {
  return new Svc({ name: "salesforce", op }, param);
}

function salesforceSyncAgent(op: string, param?: any): Svc {
  return new Svc({ name: "salesforce_service", op }, param);
}

const glue = {
  ensureHook: [],
  refreshToken: [],
  getFetchWindow: [
    set("fetchStart", ex(ex(moment(), "subtract", { minutes: 6 }), "valueOf")),
    set("fetchEnd", ex(moment(), "valueOf")),
  ],
  getFetchFields: [
    set("defaultFetchFields", ld("map", ld("get", defaultFields, "${fetchType}"), "service")),
    set("attributeMappingKey", ld("toLower", "${fetchType}_attributes_inbound")),
    set("settingsFetchFields", ld("compact", ld("map", settings("${attributeMappingKey}"), "service"))),
    set("fetchFields", ld("uniq", ld("concat", "${defaultFetchFields}", "${settingsFetchFields}"))),

    ifL([cond("isEqual", "${fetchType}", "Task"), not(ld("isNil", settings("salesforce_external_id")))], [
      set("fetchFields", ld("concat", "${fetchFields}", settings("salesforce_external_id")))
    ])
  ],
  fetchRecent: [
    route("getFetchWindow"),
    route("getFetchFields"),
    set("salesforceIds", salesforceSyncAgent("getUpdatedRecordIds", { type: "${fetchType}", fetchStart: "${fetchStart}", fetchEnd: "${fetchEnd}" })),
    salesforceSyncAgent("saveRecords", { type: "${fetchType}", ids: "${salesforceIds}", fields: "${fetchFields}" })
  ],

  fetchRecentContacts: [
    set("fetchType", "Contact"),
    route("fetchRecent")
  ],
  fetchRecentLeads: [
    set("fetchType", "Lead"),
    route("fetchRecent")
  ],
  fetchRecentAccounts: [
    ifL(settings("fetch_accounts"), [
      set("fetchType", "Account"),
      route("fetchRecent")
    ])
  ],
  fetchRecentTasks: [
    set("fetchType", "Task"),
    route("fetchRecent")
  ],

  fetchRecentDeleted: [
    route("getFetchWindow"),
    set("salesforceIds", salesforceSyncAgent("getDeletedRecordIds", { type: "${fetchType}", fetchStart: "${fetchStart}", fetchEnd: "${fetchEnd}" }))
  ],
  fetchRecentDeletedContacts: [
    set("fetchType", "Contact"),
    route("fetchRecentDeleted"),
    salesforceSyncAgent("saveDeleted", { type: "Contact", deletedRecords: "${salesforceIds}" })
  ],
  fetchRecentDeletedLeads: [
    set("fetchType", "Lead"),
    route("fetchRecentDeleted"),
    salesforceSyncAgent("saveDeleted", { type: "Lead", deletedRecords: "${salesforceIds}" })
  ],
  fetchRecentDeletedAccounts: [
    set("fetchType", "Account"),
    route("fetchRecentDeleted"),
    salesforceSyncAgent("saveDeleted", { type: "Account", deletedRecords: "${salesforceIds}" })
  ],
  fetchRecentDeletedTasks: [
    set("fetchType", "Task"),
    route("fetchRecentDeleted"),
    route("getFetchFields"),
    salesforceSyncAgent("saveRecords", { type: "${fetchType}", ids: ld("map", "${salesforceIds}", "id"), fields: "${fetchFields}", executeQuery: "queryAll" })
  ],

  fetchAll: [
    set("defaultFetchFields", ld("map", ld("get", defaultFields, "${fetchType}"), "service")),
    set("attributeMappingKey", ld("toLower", "${fetchType}_attributes_inbound")),
    set("settingsFetchFields", ld("compact", ld("map", settings("${attributeMappingKey}"), "service"))),

    set("fetchFields", ld("uniq", ld("concat", "${defaultFetchFields}", "${settingsFetchFields}"))),
    salesforceSyncAgent("getAllRecords", { type: "${fetchType}", fields: "${fetchFields}" })
  ],
  fetchAllContacts: [
    set("fetchType", "Contact"),
    route("fetchAll")
  ],
  fetchAllLeads: [
    set("fetchType", "Lead"),
    route("fetchAll")
  ],
  fetchAllAccounts: [
    set("fetchType", "Account"),
    route("fetchAll")
  ],
  fetchAllTasks: [
    set("fetchType", "Task"),
    route("fetchAll")
  ]
};

module.exports = glue;
