/* @flow */

const {
  route,
  cond,
  hull,
  set,
  get,
  filter,
  notFilter,
  filterL,
  ifL,
  iterateL,
  loopL,
  loopEndL,
  input,
  Svc,
  settings,
  settingsUpdate,
  cacheWrap,
  cacheSet,
  cacheGet,
  cacheLock,
  transformTo,
  jsonata,
  ld,
  inc,
  moment,
  ex,
  cast,
  utils,
  not,
  or
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingAccount
} = require("./service-objects");

// const {  } = require("./service-objects");

function coppercrm(op: string, param?: any): Svc {
  return new Svc({ name: "coppercrm", op }, param);
}


const glue = {
  // Simple status which will return setup required if we don't have credentials filled out
  // TODO need to make a call to marketo to confirm it works...
  status: {},

  // Hmmmm this is configured logic seems to be a prerequisite to do anything
  // maybe the ensure route needs to call it automatically and stop it
  // that being said, it shouldn't stop it for "status" endpoint
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("coppercrm_api_key")),
    cond("notEmpty", settings("coopercrm_email"))
  ]),


  // Setup marketo api from the configured values
  ensureSetup:
    ifL(route("isConfigured"), [
    ]),

  //don't do anything on ship update
  shipUpdate: {},

  //Incremental polling logic
  fetchAllLeads:[
    set("pageOffset", 1),
    loopL([

      set("leadPage", coppercrm("fetchAllLeads")),

      iterateL("${leadPage}", { key: "lead", async: true }, hull("asUser", cast(CopperCRMIncomingLead, "${lead}"))),

      set("createdAtOffset", get("date_created", ld("last", "${leadPage}"))),
      ifL(cond("lessThan", "${leadPage.length}", 1), loopEndL()),

      // doing this if we know that the number of contacts on the same date_created is greater than the page size
      // will avoid loops
      ifL(cond("isEqual", get("date_created", ld("first", "${leadPage}")), get("date_created", ld("last", "${leadPage}"))), {
        do: set("pageOffset", inc("${pageOffset}")),
        eldo: set("pageOffset", 1)
      })
    ])
  ],
  fetchRecentLeads: cacheLock("fetchRecentLeads", [

    set("modifiedAtOffset", settings("last_fetch_timestamp")),
    ifL(cond("isEmpty", "${modifiedAtOffset}"), set("modifiedAtOffset", ex(ex(moment(), "subtract", { hour: 1 }), "unix"))),
    set("pageOffset", 1),

    loopL([
      set("leadPage", coppercrm("fetchRecentLeads")),

      iterateL("${leadPage}", { key: "lead", async: true }, hull("asUser", cast(CopperCRMIncomingLead, "${lead}"))),

      // TODO if leadPage is empty, we'll going to have an issue
      set("modifiedAtOffset", get("date_modified", ld("last", "${leadPage}"))),

      ifL(cond("lessThan", "${leadPage.length}", 1), loopEndL()),
      // doing this if we know that the number of contacts on the same date_created is greater than the page size
      // will avoid loops
      ifL(cond("isEqual", get("date_modified", ld("first", "${leadPage}")), get("date_modified", ld("last", "${leadPage}"))), {
        do: set("pageOffset", inc("${pageOffset}")),
        eldo: set("pageOffset", 1)
      })
    ]),

    settingsUpdate({last_fetch_timestamp: "${modifiedAtOffset}"}),
  ]),
  fetchAllPeople: {},
  fetchRecentPeople: {},
  fetchAllCompanies: {},
  fetchRecentCompanies: {},
  leadFields: ld("concat", require("lead_fields"), route("customLeadFields")),
  peopleFields: ld("concat", require("people_fields"), route("customPeopleFields")),
  customLeadFields: jsonata("$[\"lead\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap("getCustomFields")),
  customPeopleFields: jsonata("$[\"people\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap("getCustomFields"))

};

module.exports = glue;
