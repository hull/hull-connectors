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
  HullOutgoingDropdownOption,
  HullConnectorAttributeDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { fetchAllByDate, fetchRecentByDate } = require("hull-connector-framework/src/purplefusion/glue-utils");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany
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
  ensure:
    ifL(route("isConfigured"), [
    ]),

  //don't do anything on ship update
  shipUpdate: {},

  // Incremental polling logic
  fetchAllLeads:
    fetchAllByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllLeads",
      incomingType: CopperCRMIncomingLead,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asUser"
    }),
  fetchRecentLeads:
    fetchRecentByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentLeads",
      incomingType: CopperCRMIncomingLead,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asUser",
      timeFormat: "unix"
    }),

  fetchAllPeople:
    fetchAllByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllPeople",
      incomingType: CopperCRMIncomingPerson,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asUser"
    }),
  fetchRecentPeople:
    fetchRecentByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentPeople",
      incomingType: CopperCRMIncomingPerson,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asUser",
      timeFormat: "unix"
    }),
  fetchAllCompanies:
    fetchAllByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllCompanies",
      incomingType: CopperCRMIncomingCompany,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asAccount"
    }),
  fetchRecentCompanies:
    fetchRecentByDate({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentCompanies",
      incomingType: CopperCRMIncomingCompany,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asAccount",
      timeFormat: "unix"
    }),
  attributesLeadsIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/lead_fields"), route("customLeadFields")))),
  attributesPeopleIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/people_fields"), route("customPeopleFields")))),
  attributesCompaniesIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/company_fields"), route("customPeopleFields")))),
  attributesOpportunitiesIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/opportunity_fields"), route("customOpportunityFields")))),
  customLeadFields: jsonata("$[\"lead\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap(6000, coppercrm("getCustomFields"))),
  customPeopleFields: jsonata("$[\"people\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap(6000, coppercrm("getCustomFields"))),
  customCompanyFields: jsonata("$[\"company\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap(6000, coppercrm("getCustomFields"))),
  customOpportunityFields: jsonata("$[\"company\" in available_on].{\"label\": name, \"name\": name, \"type\": data_type, \"readOnly\": false}", cacheWrap(6000, coppercrm("getCustomFields"))),
  getAssignees: cacheWrap(6000, coppercrm("getUsers")),
  getContactTypes: cacheWrap(6000, coppercrm("getContactTypes")),
  getCustomerSources: cacheWrap(6000, coppercrm("getCustomerSources")),
  getLossReason: cacheWrap(6000, coppercrm("getLossReason")),
  getPipelines: cacheWrap(6000, coppercrm("getPipelines")),
  getPipelineStages: cacheWrap(6000, coppercrm("getPipelineStages")),


};

module.exports = glue;
