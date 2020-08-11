/* @flow */

import {
  IntercomUserRead,
  IntercomLeadRead,
  IntercomCompanyRead,
  IntercomIncomingAttributeDefinition,
  IntercomOutgoingAttributeDefinition,
  IntercomAttributeWrite,
  IntercomAttributeMapping,
  IntercomWebhookUserEventRead,
  IntercomWebhookLeadEventRead,
  IntercomWebhookEventRead
} from "./service-objects";
import { filterL } from "hull-connector-framework/src/purplefusion/language";
import { HullIncomingEvent, HullApiAttributeDefinition } from "hull-connector-framework/src/purplefusion/hull-service-objects";
const { EVENT_MAPPING } = require("./event-mapping");
const _ = require("lodash");

const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullOutgoingUser,
  HullOutgoingEvent,
  HullAttributeMapping,
  HullUserIdentity
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const defaultContactFields = require("./fields/default-contact-fields.json");
const defaultCompanyFields = require("./fields/default-company-fields.json");

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

function intercom(op: string, param?: any): Svc {
  return new Svc({ name: "intercom", op }, param);
}

const glue = {
  ensure: [
    set("intercomApiVersion", "2.1"),
    set("service_name", "intercom")
  ],
  shipUpdate: [
    route("syncDataAttributes")
  ],
  status: ifL(cond("isEmpty", settings("access_token")), {
    do: {
      status: "setupRequired",
      message: "'Connector has not been authenticated with Intercom."
    },
    eldo: {
      status: "ok",
      message: "allgood"
    }
  }),
  deleteContact: [],
  deleteUser: [],
  contactFieldsInbound: returnValue([
      set("contactInboundFields", ld("concat", defaultContactFields, intercom("getContactDataAttributes")))
    ],
    transformTo(HullIncomingDropdownOption, cast(IntercomIncomingAttributeDefinition, "${contactInboundFields}"))
  ),
  contactFieldsOutbound: returnValue([
      set("contactOutboundFields", ld("concat", defaultContactFields, intercom("getContactDataAttributes")))
    ],
    transformTo(HullOutgoingDropdownOption, cast(IntercomOutgoingAttributeDefinition, "${contactOutboundFields}"))
  ),
  companyFieldsInbound: returnValue([
      set("companyInboundFields", ld("concat", defaultCompanyFields, intercom("getCompanyDataAttributes")))
    ],
    transformTo(HullIncomingDropdownOption, cast(IntercomIncomingAttributeDefinition, "${companyInboundFields}"))
  ),
  refreshToken: [],
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("access_token"))
  ]),
  getFetchWindow: [
    set("fetchStart", ex(ex(moment(), "subtract", { minutes: 6 }), "valueOf")),
    set("fetchEnd", ex(moment(), "valueOf")),
  ],
  getFetchFields: [],
  fetchRecentCompanies: cacheLock("fetchRecentCompanies", [
    ifL(
      cond("allTrue", [
        route("isConfigured"),
        settings("fetch_companies")
      ]), [
        set("attributeOperation", "set"),
        set("pageOffset", 1),
        set("pageSize", 60),
        set("lastFetchAt", settings("companies_last_fetch_timestamp")),
        ifL(cond("isEmpty", "${lastFetchAt}"), [
          set("lastFetchAt", ex(ex(moment(), "subtract", { minute: 5 }), "unix"))
        ]),
        settingsUpdate({companies_last_fetch_timestamp: ex(moment(), "unix") }),
        loopL([
          set("page", intercom("getAllCompaniesScroll")),

          ifL(or([
            cond("isEmpty", "${page}"),
            cond("isEmpty", "${page.data}")
          ]), loopEndL()),

          set("intercomCompanies", filterL(or([
            cond("greaterThan", "${company.updated_at}", "${lastFetchAt}"),
            cond("isEqual", "${company.updated_at}", "${lastFetchAt}")
          ]), "company", "${page.data}")),
          iterateL("${intercomCompanies}", { key: "intercomCompany", async: true},
            hull("asAccount", cast(IntercomCompanyRead, "${intercomCompany}"))
          ),

          set("offset", "${page.scroll_param}"),
          set("page", [])
        ])
      ])
  ]),
  fetchAllCompanies: ifL(
    cond("allTrue", [
      route("isConfigured")
    ]), [
      loopL([
        set("page", intercom("getAllCompaniesScroll")),
        ifL(or([
          cond("isEmpty", "${page}"),
          cond("isEmpty", "${page.data}")
        ]), loopEndL()),
        iterateL("${page.data}", { key: "intercomCompany", async: true},
          hull("asAccount", cast(IntercomCompanyRead, "${intercomCompany}"))
        ),
        set("offset", "${page.scroll_param}"),
        set("page", []),
      ])
  ]),
  fetchContacts: [
    ifL(cond("isEmpty", "${lastFetchAt}"), {
      do: set("fetchFrom", ex(ex(moment(), "subtract", { day: 1 }), "unix")),
      eldo: [
        set("secondsInDay", 86400),
        set("fetchFrom", ld("subtract", "${lastFetchAt}", "${secondsInDay}"))
      ]
    }),
    ifL(cond("isEqual", "${fetchAll}", true), set("fetchFrom", 0)),

    loopL([
      set("page", intercom("getContacts", {
        "query":  {
          "operator": "AND",
          "value": [
            { "field": "updated_at", "operator": ">", "value": "${fetchFrom}" },
            { "field": "role", "operator": "=", "value": "${service_type}" }
          ]
        },
        "pagination": {
          "per_page": 150,
          "starting_after": "${pageOffset}"
        },
        "sort": {
          "field": "updated_at",
          "order": "descending"
        }
      })),
      set("intercomContacts", filterL(or([
        cond("greaterThan", "${contact.updated_at}", "${lastFetchAt}"),
        cond("isEqual", "${contact.updated_at}", "${lastFetchAt}")
      ]), "contact", "${page.data}")),
      iterateL("${intercomContacts}", { key: "intercomContact", async: true },
        hull("asUser", cast("${transformTo}", "${intercomContact}"))
      ),
      ifL(or([
        cond("isEqual", "${page.pages.next}", undefined),
        cond("isEmpty", "${page.pages.next}"),
        cond("lessThan", get("updated_at", ld("last", "${page.data}")), "${lastFetchAt}")
      ]), loopEndL()),
      set("pageOffset", "${page.pages.next.starting_after}")
    ])
  ],
  fetchRecentLeads: ifL(
    cond("allTrue", [
      route("isConfigured"),
      settings("fetch_leads")
    ]), [
      set("service_type", "lead"),
      set("transformTo", IntercomLeadRead),
      set("lastFetchAt", settings("leads_last_fetch_timestamp")),
      settingsUpdate({ leads_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchRecentUsers: ifL(
    cond("allTrue", [
      route("isConfigured"),
      settings("fetch_users")
    ]), [
      set("service_type", "user"),
      set("transformTo", IntercomUserRead),
      set("lastFetchAt", settings("users_last_fetch_timestamp")),
      settingsUpdate({ users_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchAllLeads: ifL(
    cond("allTrue", [
      route("isConfigured")
    ]), [
      set("service_type", "lead"),
      set("transformTo", IntercomLeadRead),
      set("lastFetchAt", 0),
      set("fetchAll", true),
      settingsUpdate({ leads_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchAllUsers: ifL(
    cond("allTrue", [
      route("isConfigured")
    ]), [
      set("service_type", "user"),
      set("transformTo", IntercomUserRead),
      set("lastFetchAt", 0),
      set("fetchAll", true),
      settingsUpdate({ users_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  getContactTags: returnValue([
    set("contactId", input("id"))
  ], intercom("getContactTags")),
  getContactCompanies: returnValue([
    set("contactId", input("id"))
  ], intercom("getContactCompanies")),
  getContactSegments: returnValue([
    set("contactId", input("id"))
  ], intercom("getContactSegments")),
  getCompanySegments: returnValue([
    set("companyId", input("id"))
  ], intercom("getCompanySegments")),

  leadUpdate: [
    set("service_type", "lead"),
    route("contactUpdate")
  ],
  userUpdate: [
    set("service_type", "user"),
    route("contactUpdate")
  ],
  contactUpdate: [
    ifL([
      cond("notEmpty", input()),
      route("isConfigured")
    ],
      iterateL(input(), { key: "message", async: true }, [
        route("contactUpdateStart", cast(HullOutgoingUser, "${message}"))
      ])
    )
  ],
  contactUpdateStart: [
    cacheLock(input("user.id"),
      ifL(or([
          set("contactId", cacheGet(input("user.id"))),
          set("contactId", input("user.intercom_${service_type}/id"))
        ]), {
          do: [
            route("updateContact")
          ],
          eldo: [
            route("contactLookup"),
            ifL(not(cond("isEqual", "${skipContact}", true)), [
              ifL([
                cond("isEmpty", "${contactId}")
              ], {
                do: route("insertContact"),
                eldo: route("updateContact")
              })
            ])
          ]
        }
      )
    )
  ],
  contactLookup: [
    route("buildContactSearchQuery"),
    ifL(cond("notEmpty", "${contactQuery}"), set("existingContacts", intercom("lookupContact", "${contactQuery}")),),
    ifL(cond("isEqual", ld("size", "${existingContacts}"), 1), set("contactId", "${existingContacts[0].id}")),
    ifL(cond("greaterThan", ld("size", "${existingContacts}"), 1), [
      // TODO what is the right way to do this?
      set("skipContact", true),
      utils("print", "Skipping Outgoing Contact - Cannot determine which contact to update")
    ])
  ],
  updateContact: [
    set("updateRoute", ld("camelCase", "update_${service_type}")),

    // TODO cacheWrap
    set("contactDataAttributes", intercom("getContactDataAttributes")),
    set("contact_custom_attributes", ld("map", filter({ "custom": true }, "${contactDataAttributes}"), "name")),
    ifL(cond("notEmpty", set("contactFromIntercom", intercom("${updateRoute}", input()))),
      [
        hull("asUser","${contactFromIntercom}"),
        ifL(cond("notEmpty", settings("outgoing_events")), [
          route("sendEvents")
        ]),
        route("checkTags")
      ]
    )
  ],
  insertContact: [
    set("insertRoute", ld("camelCase", "insert_${service_type}")),

    // TODO cacheWrap
    set("contactDataAttributes", intercom("getContactDataAttributes")),

    set("outgoing_lead_attributes", transformTo(IntercomAttributeMapping, cast(HullAttributeMapping, settings("outgoing_lead_attributes")))),
    set("outgoing_user_attributes", transformTo(IntercomAttributeMapping, cast(HullAttributeMapping, settings("outgoing_user_attributes")))),
    set("contact_custom_attributes", ld("map", filter({ "custom": true }, "${contactDataAttributes}"), "name")),

    ifL(cond("notEmpty", set("contactFromIntercom", intercom("${insertRoute}", input()))),
      [
        hull("asUser","${contactFromIntercom}"),
        ifL(cond("notEmpty", settings("outgoing_events")), [
          route("sendEvents")
        ]),
        route("checkTags")
      ]
    )
  ],
  buildContactSearchQuery: [
    set("queries", utils("emptyArray")),
    iterateL(notFilter({ service: "id" }, settings("${service_type}_claims")), "claim",
      ifL([
          cond("notEmpty", set("claimValue", input("user.${claim.hull}"))),
          cond("notEmpty", set("claimProperty", "${claim.service}")),
        ],
        [
          ex("${queries}", "push", {
            "field": "${claimProperty}",
            "operator": "=",
            "value": "${claimValue}"
          }),
        ]
      )
    ),
    ifL(cond("notEmpty", "${queries}"), {
      do: [
        ex("${queries}", "push", {
          "field": "role",
          "operator": "=",
          "value": "${service_type}"
        }),
        set("contactQuery", {
          "query":  {
            "operator": "AND",
            "value": "${queries}"
          }
        })
      ],
      eldo: [
        set("contactQuery", {})
      ]
    })
  ],
  checkTags: [
    ifL([
      cond("isEqual", settings("tag_leads"), true),
      cond("isEqual", "${service_type}", "lead")
    ], [
      route("handleContactTags")
    ]),
    ifL([
      cond("isEqual", settings("tag_users"), true),
      cond("isEqual", "${service_type}", "user")
    ], [
      route("handleContactTags")
    ])
  ],
  handleContactTags: [
    set("allTags", intercom("getAllTags")),

    set("contactId", "${contactFromIntercom.id}"),
    set("contactTags", ld("map", intercom("getContactTags"), "name")),

    set("tagsOnHullUser", input("user.intercom_lead/tags")),

    set("segmentsIn", ld("map", input("segments"), "name")),
    set("segmentsLeft", ld("map", input("changes.segments.left"), "name")),

    set("missingTags", ld("difference", "${segmentsIn}", "${tagsOnHullUser}")),
    iterateL("${missingTags}", "segmentName", [
      set("existingTag", filter({ name: ld("trim", "${segmentName}") }, "${allTags}")),
      ifL(cond("notEmpty", "${existingTag}"), {
        do: [
          ifL(not(ld("includes", "${contactTags}", "${existingTag[0].name}")), [
            set("tagId", "${existingTag[0].id}"),
            intercom("tagContact", {
              "id": "${tagId}"
            })
          ])
        ],
        eldo: [
          set("createdTag", intercom("createTag", {
            "name": "${segmentName}"
          })),
          intercom("tagContact", {
            "id": "${createdTag.id}"
          })
        ]
      })
    ]),
    iterateL("${segmentsLeft}", "segmentName", [
      set("existingTag", filter({ name: "${segmentName}" }, "${allTags}")),
      ifL(cond("notEmpty", "${existingTag}"), {
        do: [
          set("tagId", "${existingTag[0].id}"),
          intercom("unTagContact")
        ],
        eldo: []
      })
    ])
  ],
  sendEvents: [
    set("contactId", "${contactFromIntercom.id}"),
    set("events", input("events")),
    set("eventNames", ld("intersection", settings("outgoing_events"), ld("map", input("events"), "event"))),
    set("hasNewEvents", cond("lessThan", 0, ld("size", "${events}"))),

    ifL("${hasNewEvents}", [

      iterateL("${eventNames}", "eventName", [
        set("event", filter({ event: "${eventName}" }, "${events}")),
        ifL(not(cond("isEqual", "${event[0].event_source}", "intercom")), [
          set("hullEvent", cast(HullOutgoingEvent, "${event[0]}")),
          intercom("submitEvent", "${hullEvent}")
        ])
      ])
    ]),
  ],
  syncDataAttributes: [
    cacheLock("syncingAttributes",
      [
        set("outgoing_user_attributes", settings("outgoing_user_attributes")),
        set("outgoing_lead_attributes", settings("outgoing_lead_attributes")),

        set("contactDataAttributes", intercom("getContactDataAttributes")),

        iterateL(ld("concat", "${outgoing_user_attributes}", "${outgoing_lead_attributes}"), "attribute", [
          ifL([
            cond("isEmpty", filter({ name: "${attribute.service}" }, "${contactDataAttributes}"))
          ], [
            set("attributeProcessing", cacheGet("${attributeName}")),
            ifL(cond("isEmpty", "${processing}"), [
              cacheSet({ key: "${attributeName}" }, "attributeProcessing"),

              set("intercomAttribute", transformTo(IntercomAttributeWrite, cast(HullApiAttributeDefinition, "${attribute}"))),
              intercom("createDataAttribute", "${intercomAttribute}")
            ])
          ])
        ])
      ]
    )
  ],
  webhooks: [
    set("webhookTopic", input("topic")),

    ifL(ld("includes", settings("incoming_events"), "${webhookTopic}"), [
      set("eventSource", "intercom"),
      set("webhookData", input("data")),

      set("eventDefinition", get("${webhookTopic}", EVENT_MAPPING)),
      set("webhookType", "${eventDefinition.webhookType}"),
      set("pathToEntity", "${eventDefinition.pathToEntity}"),
      set("eventName", "${eventDefinition.eventName}"),
      set("eventType", "${eventDefinition.eventType}"),
      set("propertiesMapping", "${eventDefinition.properties}"),
      set("contextMapping", "${eventDefinition.context}"),
      set("transformTo", "${eventDefinition.transformTo}"),
      set("asEntity", "${eventDefinition.asEntity}"),

      ifL(cond("isEqual", "${eventDefinition.webhookType.name}", "Conversation"), [
        set("eventItem", input("${pathToEntity}.type")),
        ifL(cond("isEqual", "${eventItem}", "user"), [
          set("webhookType", IntercomWebhookUserEventRead)
        ]),
        ifL(cond("isEqual", "${eventItem}", "lead"), [
          set("webhookType", IntercomWebhookLeadEventRead)
        ])
      ]),

      set("action", get("action", "${eventDefinition}")),
      ifL(cond("isEqual", "${action}", "track"), [
        set("identity", transformTo(HullUserIdentity, cast("${webhookType}", input("${pathToEntity}")))),
        ifL(cond("notEmpty", "${identity}"), [
          hull("asUser", {
            ident: "${identity}",
            events: [
              transformTo(HullIncomingEvent, cast(IntercomWebhookEventRead, input()))
            ]
          })
        ])
      ]),
      ifL(cond("isEqual", "${action}", "traits"), [
        set("webhookType", "${eventDefinition.webhookType}"),
        ifL(cond("isEqual", "${webhookTopic}", "user.deleted"), [
          set("service_name", ld("toLower", "intercom_${webhookType.name}")),
        ]),
        ifL(cond("isEmpty", "${pathToEntity}"), {
          do: set("transformInput", input()),
          eldo: set("transformInput", input("${pathToEntity}"))
        }),
        hull("${asEntity}", transformTo("${transformTo}", cast("${webhookType}", "${transformInput}")))
      ])
    ])
  ]
};

module.exports = glue;
