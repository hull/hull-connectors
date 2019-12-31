/* @flow */

const {
  route,
  cond,
  hull,
  set,
  ifL,
  iterateL,
  input,
  Svc,
  settings,
  settingsSet,
  cacheWrap,
  cacheDel,
  returnValue,
  transformTo,
  jsonata,
  ld,
  ex,
  cast,
  utils,
  not,
  moment
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullIncomingDropdownOption,
  HullConnectorAttributeDefinition,
  HullIncomingUser,
  HullIncomingAccount
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  fetchAllByStaticDateAscFilteredWithPaging,
  fetchRecentModifiedAscFilteredWithPaging,
  fetchRecentModifiedDescWithPaging
} = require("hull-connector-framework/src/purplefusion/glue-predefined");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity,
  CopperCRMIncomingActivity
} = require("./service-objects");

// in seconds for in memory cache and redis cache
const StandardEnumTimeout = 50;

function coppercrm(op: string, param?: any): Svc {
  return new Svc({ name: "coppercrm", op }, param);
}

function ensureWebhook(webhookAttribute, webhookTruthy) {
  const webhookIdAttribute = `${webhookAttribute}Id`;
  return ifL(cond("isEmpty", settings(webhookIdAttribute)),[

    ifL(cond("isEmpty", "${webhooks}"), set("webhooks", coppercrm("getAllWebhooks"))),

    iterateL("${webhooks}", "webhook",
      ifL(ld("isMatch", "${webhook}", webhookTruthy),
        ifL(ld("isMatch", "${webhook}", { target: "${webhookUrl}"}), {
          do: set(webhookAttribute, "${webhook}"),
          eldo:
            ifL(ex("${webhook.target}", "includes", utils("getConnectorOrganization")),
              coppercrm("deleteWebhook")
            )
        })
      )
    ),

    ifL(cond("isEmpty", `\${${webhookAttribute}}`),
      set(webhookAttribute, coppercrm("createWebhook",
        {
          target: "${webhookUrl}",
          secret: {
            organization: utils("getConnectorOrganization"),
            ship: utils("getConnectorId"),
            secret: utils("getConnectorSecret")
          },
          ...webhookTruthy
        }))
    ),
    settingsSet(webhookIdAttribute, `\${${webhookAttribute}.id}`),
    set(`settingsWebhookIds.${webhookIdAttribute}`, `\${${webhookAttribute}.id}`)
  ])
}


const glue = {
  status: ifL(route("isConfigured"), {
    do: ifL(cond("isEmpty", coppercrm("getUsers")), {
      do: {
        status: "warning",
        message: "No users associated with CopperCRM instance"
      }
    }),
    eldo: {
      status: "setupRequired",
      message: "'Connector has not been authenticated. Please make sure to allow Hull to access your Outreach data by going to the \"Settings\" tab and clicking \"Login to your Outreach account\" in the \"Connect to Outreach\" section'"
    }
  }),

  // Hmmmm this is configured logic seems to be a prerequisite to do anything
  // maybe the ensure route needs to call it automatically and stop it
  // that being said, it shouldn't stop it for "status" endpoint
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("coppercrm_api_key")),
    cond("notEmpty", settings("coppercrm_email"))
  ]),


  // Setup marketo api from the configured values
  ensure: [
    set("service_name", "coppercrm"),
    ifL(route("isConfigured"), route("createDeleteWebhooks"))
  ],

  //don't do anything on ship update
  shipUpdate: {},

  webhooks: route("handleWebhook", input("body")),
  handleWebhook: ifL(cond("isEqual", input("event"), "delete"),
    ifL(cond("isEqual", input("type"), "lead"), {
      do: [
        // have to set service_name, because it's the value we try to use as a prefix for deleted_at
        set("service_name", "coppercrm_lead"),
        iterateL(input("ids"), "id", hull("userDeletedInService",
          cast(HullIncomingUser, { ident: { anonymous_id: "coppercrm-lead:lead-${id}" }, attributes: { "${service_name}/deleted_at": ex(moment(), "valueOf") } })))
      ],
      elif: [
        ifL(cond("isEqual", input("type"), "person"),[
          // have to set service_name, because it's the value we try to use as a prefix for deleted_at
          set("service_name", "coppercrm_person"),
          iterateL(input("ids"), "id", hull("userDeletedInService",
            cast(HullIncomingUser, { ident: { anonymous_id: "coppercrm-person:person-${id}" }, attributes: { "${service_name}/deleted_at": ex(moment(), "valueOf") }  })))
        ]),
        ifL(cond("isEqual", input("type"), "account"),
          iterateL(input("ids"), "id", hull("accountDeletedInService",
            cast(HullIncomingAccount, { ident: { anonymous_id: "coppercrm:${id}" }, attributes: { "${service_name}/deleted_at": ex(moment(), "valueOf") }  })))
        )
      ]
    })
  ),

  // Incremental polling logic
  fetchAllLeads: ifL(route("isConfigured"),
    fetchAllByStaticDateAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllLeads",
      incomingType: CopperCRMIncomingLead,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asUser"
    })
  ),
  fetchRecentLeads: ifL(route("isConfigured"),
    fetchRecentModifiedAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentLeads",
      incomingType: CopperCRMIncomingLead,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asUser",
      timeFormat: "unix"
    })
  ),

  fetchAllPeople: ifL(route("isConfigured"),
    fetchAllByStaticDateAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllPeople",
      incomingType: CopperCRMIncomingPerson,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asUser"
    })
  ),
  fetchRecentPeople: ifL(route("isConfigured"),
    fetchRecentModifiedAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentPeople",
      incomingType: CopperCRMIncomingPerson,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asUser",
      timeFormat: "unix"
    })
  ),
  fetchAllCompanies: ifL(route("isConfigured"),
    fetchAllByStaticDateAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllCompanies",
      incomingType: CopperCRMIncomingCompany,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asAccount"
    })
  ),
  fetchRecentCompanies: ifL(route("isConfigured"),
    fetchRecentModifiedAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentCompanies",
      incomingType: CopperCRMIncomingCompany,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asAccount",
      timeFormat: "unix"
    })
  ),
  fetchAllOpportunities: ifL(route("isConfigured"),
    fetchAllByStaticDateAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchAllOpportunities",
      incomingType: CopperCRMIncomingOpportunity,
      datePathOnEntity: "date_created",
      pageSize: 100,
      hullCommand: "asOpportunity",
      timeFormat: "unix"
    })
  ),
  fetchRecentOpportunities: ifL(route("isConfigured"),
    fetchRecentModifiedAscFilteredWithPaging({
      serviceName: "coppercrm",
      fetchEndpoint: "fetchRecentOpportunities",
      incomingType: CopperCRMIncomingOpportunity,
      datePathOnEntity: "date_modified",
      pageSize: 100,
      hullCommand: "asOpportunity",
      timeFormat: "unix"
    })
  ),
  fetchAllActivities: ifL(route("isConfigured"),
    ifL(route("toFetchActivities"),
      fetchAllByStaticDateAscFilteredWithPaging({
        serviceName: "coppercrm",
        fetchEndpoint: "fetchAllActivities",
        incomingType: CopperCRMIncomingActivity,
        datePathOnEntity: "activity_date",
        pageSize: 100,
        hullCommand: "asUser",
        timeFormat: "unix",
        fetchBody: { activity_types: "${activityTypes}" }
      })
    )
  ),
  fetchRecentActivities: ifL(route("isConfigured"),
    ifL(route("toFetchActivities"),
      fetchRecentModifiedDescWithPaging({
        serviceName: "coppercrm",
        fetchEndpoint: "fetchRecentActivities",
        incomingType: CopperCRMIncomingActivity,
        datePathOnEntity: "date_modified",
        pageSize: 100,
        hullCommand: "asUser",
        timeFormat: "unix",
        fetchBody: { activity_types: "${activityTypes}" }
      })
    )
  ),
  toFetchActivities: ifL(cond("isEmpty", settings("activities_to_fetch")), {
    do: false,
    eldo: returnValue(
      set("activityTypes", jsonata(`$.{ "id": $number($), "category": "user" }`, settings("activities_to_fetch"))),
      true
    )
  }),
  attributesActivitiesIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, route("getUserActivityTypes"))),
  getUserActivityTypes: jsonata(`user.{ "name": $string(id), "display": name}`, route("getActivityTypes")),
  getActivityTypesMap: jsonata(`user{ $string(id): name}`, route("getActivityTypes")),
  forceGetActivityTypesMap: returnValue(cacheDel(coppercrm("getActivityTypes")), route("getActivityTypesMap")),
  getActivityTypes: cacheWrap(StandardEnumTimeout, coppercrm("getActivityTypes")),

  attributesLeadsIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/lead_fields"), route("customLeadFields")))),
  attributesPeopleIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/people_fields"), route("customPeopleFields")))),
  attributesCompaniesIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/company_fields"), route("customCompanyFields")))),
  attributesOpportunitiesIncoming: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, ld("concat", require("./fields/opportunity_fields"), route("customOpportunityFields")))),
  customLeadFields: jsonata(`$["lead" in available_on].{"display": name, "name": name, "type": data_type, "readOnly": false}`, route("getCustomFields")),
  customPeopleFields: jsonata(`$["people" in available_on].{"display": name, "name": name, "type": data_type, "readOnly": false}`, route("getCustomFields")),
  customCompanyFields: jsonata(`$["company" in available_on].{"display": name, "name": name, "type": data_type, "readOnly": false}`, route("getCustomFields")),
  customOpportunityFields: jsonata(`$["opportunity" in available_on].{"display": name, "name": name, "type": data_type, "readOnly": false}`, route("getCustomFields")),

  getCustomFieldMap: jsonata("$ {$string(id): name}", route("getCustomFields")),
  forceGetCustomFieldMap: returnValue(cacheDel(coppercrm("getCustomFields")), route("getCustomFieldMap")),

  getCustomFieldMapAll: jsonata("$ {$string(id): {\"name\": name, \"type\": data_type }}", route("getCustomFields")),
  forceGetCustomFieldMapAll: returnValue(cacheDel(coppercrm("getCustomFields")), route("getCustomFieldMapAll")),

  getCustomFieldValueMap: jsonata("$.options{$string(id): name}", route("getCustomFields")),
  forceGetCustomFieldValueMap: returnValue(cacheDel(coppercrm("getCustomFields")), route("getCustomFieldValueMap")),

  getCustomFields: ifL(route("isConfigured"), {
    do: cacheWrap(StandardEnumTimeout, coppercrm("getCustomFields")),
    eldo: []
  }),

  getAssignees: jsonata("$ {$string(id): email}", cacheWrap(StandardEnumTimeout, coppercrm("getUsers"))),
  forceGetAssignees: returnValue(cacheDel(coppercrm("getUsers")), route("getAssignees")),

  getContactTypes: jsonata("$ {$string(id): name}", cacheWrap(StandardEnumTimeout, coppercrm("getContactTypes"))),
  forceGetContactTypes: returnValue(cacheDel(coppercrm("getContactTypes")), route("getContactTypes")),

  getPersonEmailById: jsonata("$ {$string(id): emails[0].email}", coppercrm("getPersonById")),

  getCustomerSources: jsonata("$ {$string(id): name}", cacheWrap(StandardEnumTimeout, coppercrm("getCustomerSources"))),
  forceGetCustomerSources: returnValue(cacheDel(coppercrm("getCustomerSources")), route("getCustomerSources")),

  getLossReasons: jsonata("$ {$string(id): name}", cacheWrap(StandardEnumTimeout, coppercrm("getLossReasons"))),
  forceGetLossReason: returnValue(cacheDel(coppercrm("getLossReasons")), route("getLossReasons")),

  getPipelines: jsonata("$ {$string(id): name}", cacheWrap(StandardEnumTimeout, coppercrm("getPipelines"))),
  forceGetPipelines: returnValue(cacheDel(coppercrm("getPipelines")), route("getPipelines")),

  // hitting the getPipelines endpoint and using jsonata to extract stages, could also hit pipelinestages endpoint, but no need to hit more than getPipelines for now
  getPipelineStages: jsonata("$.stages{$string(id): name}", cacheWrap(StandardEnumTimeout, coppercrm("getPipelines"))),
  forceGetPipelineStages: returnValue(cacheDel(coppercrm("getPipelines")), route("getPipelineStages")),

  createDeleteWebhooks: [
    set("webhookUrl", utils("createWebhookUrl")),
    // ensureWebhook("deleteLeadWebhook", { type: "lead", event: "delete" }),
    // ensureWebhook("deletePersonWebhook", { type: "person", event: "delete" }),
    // ensureWebhook("deleteCompanyWebhook", { type: "company", event: "delete" }),
    // ensureWebhook("deleteOpportunityWebhook", { type: "opportunity", event: "delete" }),
    // ifL(not(cond("isEmpty", "${settingsWebhookIds}")), hull("settingsUpdate", "${settingsWebhookIds}"))
  ]


};

module.exports = glue;
