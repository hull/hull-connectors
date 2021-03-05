/* @flow */

import {
  FreshsuccessContactRead,
  FreshsuccessContactWrite,
  FreshsuccessContactWrites,
  FreshsuccessAccountRead,
  FreshsuccessAccountWrite,
  FreshsuccessAccountWrites,
  FreshsuccessIncomingAttributeDefinition,
  FreshsuccessOutgoingAttributeDefinition
} from "./service-objects";

const _ = require("lodash");

const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullOutgoingAccount,
  HullOutgoingUser,
  HullAccountRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const defaultAccountFields = require("./fields/default-account-fields.json");
const defaultContactFields = require("./fields/default-contact-fields.json");

const {
  route,
  set,
  get,
  ifL,
  Svc,
  moment,
  filterL,
  settings,
  ex,
  cast,
  cond,
  ld,
  iterateL,
  loopEndL,
  loopL,
  or,
  hull,
  settingsUpdate,
  input,
  returnValue,
  transformTo,
  cacheLock,
  cacheGet,
  cacheSet,
  notFilter,
  not,
  utils,
  filter,
  cacheWrap,
  jsonata
} = require("hull-connector-framework/src/purplefusion/language");

function freshsuccess(op: string, param?: any): Svc {
  return new Svc({ name: "freshsuccess", op }, param);
}

const getCustomAttributes = (params) => {
  const { serviceAttributes, reservedAttributes } = params;

  return _.filter(serviceAttributes, serviceAttribute => {
    return _.size(_.filter(reservedAttributes, reservedAttribute => {
      return _.startsWith(serviceAttribute, reservedAttribute)
    }));
  });
}

const dimensionAttributes = [
  "custom_label_dimensions",
  "custom_value_dimensions",
  "custom_event_dimensions"
];

// const reservedAttributes = _.concat(dimensionAttributes, complexObjectAttributes);

const accountServiceSchema = {
  join_date: {
    type: "long_milliseconds"
  },
  renewal_date: {
    type: "long_milliseconds"
  },
  latest_status_date: {
    type: "long_milliseconds"
  }
};

const contactServiceSchema = {};

const getDimensionAttributeMapping = ({ hull_type, custom_attribute_group }) => {
  const attributeRegex = new RegExp(`^${custom_attribute_group}(_|\.)`, "g");
  return ifL(cond("notEmpty", settings(`outgoing_${hull_type}_attributes`)),[
    set(`outgoing_${custom_attribute_group}`, utils("emptyArray")),
    iterateL(
      filterL(ld("startsWith", "${attribute.service}", custom_attribute_group), "attribute", settings(`outgoing_${hull_type}_attributes`)),
      "attr",
      [
        ifL(or([
            ld("startsWith", "${attr.service}", `${custom_attribute_group}_`),
            ld("startsWith", "${attr.service}", `${custom_attribute_group}.`)
          ]),
          [
            ex(`\${outgoing_${custom_attribute_group}}`, "push", {
              "service": ld("replace", "${attr.service}", attributeRegex, ""),
              "hull": "${attr.hull}"
            }),
          ],
        )
      ]
    )
  ])
};

const logOutgoingSuccess = ({ hull_type }) => {
  return hull("outgoingSuccess", {
    entity: { [hull_type]: { external_id: `\${successful_upsert.${hull_type}_id}` } },
    data: "${successful_upsert}"
  })
}

const logOutgoingError = ({ hull_type }) => {
  return hull("outgoingError", {
    entity: { [hull_type]: { external_id: `\${failed_upsert.${hull_type}_id}` } },
    reason: "${failed_upsert.message}"
  })
}

const entityUpdate = ({ hull_type, service_type, source_data_type, destination_data_type, bulk_data_type }) => {
  return [
    ifL([
      cond("notEmpty", input()),
      route("isConfigured")
    ], [
      set("service_type", service_type),
      set("custom_attributes",
        utils("anyFn", {
          fn: getCustomAttributes,
          serviceAttributes: ld("map", settings(`outgoing_${hull_type}_attributes`), "service"),
          reservedAttributes: dimensionAttributes
        })),

      getDimensionAttributeMapping({
        hull_type: hull_type,
        custom_attribute_group: "custom_label_dimensions"
      }),
      getDimensionAttributeMapping({
        hull_type: hull_type,
        custom_attribute_group: "custom_value_dimensions"
      }),
      getDimensionAttributeMapping({
        hull_type: hull_type,
        custom_attribute_group: "custom_event_dimensions"
      }),

      set("outgoingEntities", transformTo(
        destination_data_type, cast(source_data_type, input())
      )),
      set("upsertEndpoint", `bulkUpsert${_.upperFirst(service_type)}s`),
      set("bulkType", bulk_data_type),
      route("bulkUpsert", "${outgoingEntities}")
    ])
  ]
}

const glue = {
  verifyAccess: freshsuccess("verifyAccess"),
  ensure: [
    set("api_host", settings("api_host")),
    set("api_key", settings("api_key"))
  ],
  shipUpdate: [],
  status: ifL(or([
    cond("isEmpty", settings("api_host")),
    cond("isEmpty", settings("api_key"))
  ]), {
    do: {
      status: "setupRequired",
      message: "Please provide API Host and API Key."
    },
    eldo: {
      status: "ok",
      message: "allgood"
    }
  }),
  accountServiceSchema: accountServiceSchema,
  contactServiceSchema: contactServiceSchema,
  accountFieldsOutbound: returnValue([
      set("accountOutboundFields", ld("concat", defaultAccountFields, [] /*freshsuccess("getAccountDataAttributes")*/))
    ],
    transformTo(HullOutgoingDropdownOption, cast(FreshsuccessOutgoingAttributeDefinition, "${accountOutboundFields}"))
  ),
  accountFieldsInbound: returnValue([
      set("accountInboundFields", ld("concat", defaultAccountFields, [] /*freshsuccess("getAccountDataAttributes")*/))
    ],
    transformTo(HullIncomingDropdownOption, cast(FreshsuccessIncomingAttributeDefinition, "${accountInboundFields}"))
  ),
  contactFieldsOutbound: returnValue([
      set("contactOutboundFields", ld("concat", defaultContactFields, [] /*freshsuccess("getContactDataAttributes")*/))
    ],
    transformTo(HullOutgoingDropdownOption, cast(FreshsuccessOutgoingAttributeDefinition, "${contactOutboundFields}"))
  ),
  contactFieldsInbound: returnValue([
      set("contactInboundFields", ld("concat", defaultContactFields, [] /*freshsuccess("getContactDataAttributes")*/))
    ],
    transformTo(HullIncomingDropdownOption, cast(FreshsuccessIncomingAttributeDefinition, "${contactInboundFields}"))
  ),
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("api_key")),
    cond("notEmpty", settings("api_host"))
  ]),
  fetchRecentContacts: cacheLock("fetchRecentContacts", [
    ifL(
      cond("allTrue", [
        route("isConfigured"),
        settings("fetch_contacts")
      ]), [
        // TODO
      ])
  ]),
  fetchRecentAccounts: cacheLock("fetchRecentCompanies", [
    ifL(
      cond("allTrue", [
        route("isConfigured"),
        settings("fetch_accounts")
      ]), [
        // TODO
      ])
  ]),
  fetchAllContacts: cacheLock("fetchAllContacts", [
    ifL(
      cond("allTrue", [
        route("isConfigured")
      ]), [
        loopL([
          set("page", freshsuccess("getAllContacts")),
          ifL(or([
            cond("isEmpty", "${page}"),
            cond("isEmpty", "${page.results}")
          ]), {
            do: loopEndL(),
            eldo: [
              iterateL("${page.results}", { key: "freshsuccessContact", async: true },
                hull("asUser", cast(FreshsuccessContactRead, "${freshsuccessContact}"))
              ),
              set("offset_page", "${page.current_page}" + 1),
              set("page", [])
            ]
          })
        ])
      ])
  ]),
  fetchAllAccounts: cacheLock("fetchAllAccounts", [
    ifL(
      cond("allTrue", [
        route("isConfigured")
      ]), [
        loopL([
          set("page", freshsuccess("getAllAccounts")),
          ifL(or([
            cond("isEmpty", "${page}"),
            cond("isEmpty", "${page.results}")
          ]), {
            do: loopEndL(),
            eldo: [
              iterateL("${page.results}", { key: "freshsuccessAccount", async: true },
                hull("asAccount", cast(FreshsuccessAccountRead, "${freshsuccessAccount}"))
              ),
              set("offset_page", "${page.current_page}" + 1),
              set("page", [])
            ]
          })
        ])
      ])
  ]),
  userUpdate: entityUpdate({
    service_type: "contact",
    hull_type: "user",
    source_data_type: HullOutgoingUser,
    destination_data_type: FreshsuccessContactWrite,
    bulk_data_type: FreshsuccessContactWrites
  }),
  accountUpdate: entityUpdate({
    service_type: "account",
    hull_type: "account",
    source_data_type: HullOutgoingAccount,
    destination_data_type: FreshsuccessAccountWrite,
    bulk_data_type: FreshsuccessAccountWrites
  }),
  bulkUpsert: [
    set("upsertResponse", freshsuccess("${upsertEndpoint}", cast("${bulkType}", { records: "${outgoingEntities}" }))),
    route("handleResults"),

    // TODO make sure not entering into infinite loop
    ifL([
      cond("isEqual", "${upsertResponse.status_is_ok}", false),
      cond("notEmpty", "${outgoingEntities}")
    ], [
      route("bulkUpsert")
    ]),
  ],

  // TODO need to add handling to service engine - need to recursively call upsert endpoint without recomputing transforms
  handleResults: [
    set("failedRecordIndices", ld("map", "${upsertResponse.failed_results}", "record")),
    ld("pullAt", "${outgoingEntities}", "${failedRecordIndices}"),
    ifL(cond("isEqual", "${upsertResponse.status_is_ok}", true), [
      ifL(cond("notEmpty", "${outgoingEntities}"), [
        iterateL("${outgoingEntities}", "successful_upsert", [
          ifL(cond("isEqual", "${service_type}", "account"), [
            logOutgoingSuccess({ hull_type: "account" })
          ]),
          ifL(cond("isEqual", "${service_type}", "contact"), [
            logOutgoingSuccess({ hull_type: "user" })
          ])
        ])
      ])
    ]),
    ifL(cond("notEmpty", "${upsertResponse.failed_results}"), [
      iterateL("${upsertResponse.failed_results}", "failed_upsert", [
        set("record", "${failed_upsert.record}"),
        ifL(cond("isEqual", "${service_type}", "account"), [
          logOutgoingError({ hull_type: "account" })
        ]),
        ifL(cond("isEqual", "${service_type}", "contact"), [
          logOutgoingError({ hull_type: "user" })
        ])
      ])
    ])
  ]
};

module.exports = glue;
