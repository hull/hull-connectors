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
  IntercomWebhookEventRead,
  IntercomWebhookLeadEventRead
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

const CACHE_TIMEOUT = 60;

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

const webhookDataTemplate = {
  "url": "${webhookUrl}",
  "topics": [
    "conversation.user.created",
    "conversation.user.replied",
    "conversation.admin.replied",
    "conversation.admin.single.created",
    "conversation.admin.assigned",
    "conversation.admin.noted",
    "conversation.admin.closed",
    "conversation.admin.opened",
    "conversation.admin.snoozed",
    "conversation.admin.unsnoozed",
    "conversation_part.tag.created",
    "conversation_part.redacted",
    "user.created",
    "user.deleted",
    "user.unsubscribed",
    "user.email.updated",
    "user.tag.created",
    "user.tag.deleted",
    "contact.created",
    "contact.signed_up",
    "contact.added_email",
    "contact.tag.created",
    "contact.tag.deleted",
    "visitor.signed_up",
    "company.created"
  ]
};

const glue = {
  ensure: [
    set("appApiVersion", "1.0"),
    set("latestApiVersion", "2.2"),
    set("intercomApiVersion", "${latestApiVersion}"),
    set("service_name", "intercom"),
    ifL(cond("isEqual", settings("receive_events"), true), [
      cacheLock("processingWebhooks", [
        route("ensureWebhooks")
      ])
    ])
  ],
  ensureWebhooks: ifL(settings("access_token"),
    ifL([
      cond("notEmpty", "${connector.private_settings.incoming_events}"),
      cond("isEmpty", "${connector.private_settings.webhook_id}")
    ], [

      set("webhookUrl", utils("createWebhookUrl")),
      set("existingWebhooks", intercom("getAllWebhooks")),
      set("sameWebhook", filter({ type: "notification_subscription", url: "${webhookUrl}" }, "${existingWebhooks}")),
      ifL("${sameWebhook[0]}", {
        do: set("webhookId", "${sameWebhook[0].id}"),
        eldo: [
          set("webhookTopics", settings("incoming_events")),
          set("webhookId", get("data.id", intercom("insertWebhook", webhookDataTemplate)))
        ]
      }),
      hull("settingsUpdate", { webhook_id:  "${webhookId}" }),
      route("deleteBadWebhooks")
    ])
  ),
  deleteBadWebhooks: [
    set("connectorOrganization", utils("getConnectorOrganization")),
    iterateL("${existingWebhooks}", "candidateWebhook",
      ifL([
        cond("not", cond("isEqual", "${candidateWebhook.url}", "${webhookUrl}")),
        ex("${candidateWebhook.url}", "includes", "${connectorOrganization}"),
      ], [
        set("webhookIdToDelete","${candidateWebhook.id}"),
        intercom("deleteWebhook")
      ])
    )
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
          set("lastFetchAt", ex(ex(moment(), "subtract", { hour: 1 }), "unix"))
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
  contactUpdateStart: cacheLock(input("user.id"), [
    set("contactDataAttributes", cacheWrap(CACHE_TIMEOUT, intercom("getContactDataAttributes"))),
    set("contact_custom_attributes", ld("map", filter({ "custom": true }, "${contactDataAttributes}"), "name")),

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
    }),

    ifL(cond("notEmpty", "${contactFromIntercom}"),
      [
        route("sendEvents"),
        route("checkTags"),
        route("convertLeadDefault"),

        hull("asUser","${contactFromIntercom}")
      ]
    )
  ]),
  convertLeadDefault: ifL([
    cond("isEqual", settings("convert_leads"), true),
    // cond("isEqual", "${service_type}", "lead"),
    cond("notEmpty", input("user.intercom_lead/user_id")),
    cond("notEmpty", input("user.intercom_user/user_id")),
    not(cond("isEqual", input("user.intercom_lead/lead_converted"), true)),
  ], [
    set("intercomApiVersion", "${appApiVersion}"),
    set("conversionRequest", jsonata("{\"contact\":{\"user_id\":`intercom_lead/user_id`},\"user\":{\"user_id\":`intercom_user/user_id`}}", input("user"))),
    intercom("convertLead", "${conversionRequest}"),
    ld("set", "${contactFromIntercom}", "lead_converted", true)
  ]),
  convertLead: [
    set("intercomApiVersion", "${appApiVersion}"),
    intercom("convertLead", input("body"))
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
    set("contactFromIntercom", intercom("${updateRoute}", input()))
  ],
  insertContact: [
    set("insertRoute", ld("camelCase", "insert_${service_type}")),
    set("contactFromIntercom", intercom("${insertRoute}", input()))
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
    set("allTags", cacheWrap(CACHE_TIMEOUT, intercom("getAllTags"))),

    set("contactId", "${contactFromIntercom.id}"),
    set("contactTags", ld("map", intercom("getContactTags"), "name")),

    set("tagsOnHullUser", input("user.intercom_${service_type}/tags")),

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
          // creating a tag will return the tag if it exists
          // so don't need to worry about invalidating
          // getAllTags cache
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
  sendEvents: ifL([
    cond("notEmpty", settings("outgoing_events")),
    cond("isEqual", settings("send_events"), true)
  ], [
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
    ])
  ]),
  syncDataAttributes: [
    cacheLock("syncingAttributes",
      [
        set("outgoing_user_attributes", settings("outgoing_user_attributes")),
        set("outgoing_lead_attributes", settings("outgoing_lead_attributes")),

        set("contactDataAttributes", cacheWrap(CACHE_TIMEOUT, intercom("getContactDataAttributes"))),

        iterateL(ld("concat", "${outgoing_user_attributes}", "${outgoing_lead_attributes}"), "attribute", [
          ifL([
            cond("isEmpty", filter({ name: "${attribute.service}" }, "${contactDataAttributes}"))
          ], [
            set("attributeProcessing", cacheGet("${attributeName}")),
            ifL(cond("isEmpty", "${attributeProcessing}"), [
              cacheSet({ key: "${attributeName}" }, "attributeProcessing"),

              set("intercomAttribute", transformTo(IntercomAttributeWrite, cast(HullApiAttributeDefinition, "${attribute}"))),
              intercom("createDataAttribute", "${intercomAttribute}")
            ])
          ])
        ])
      ]
    )
  ],
  webhooks:
    ifL(cond("isEqual", settings("receive_events"), true), [
      set("webhookData", input("body")),
      set("webhookTopic", "${webhookData.topic}"),

      ifL(ld("includes", settings("incoming_events"), "${webhookTopic}"), [
        set("eventSource", "intercom"),

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
          set("eventItem",  get("${pathToEntity}.type", "${webhookData}")),
          ifL(cond("isEqual", "${eventItem}", "user"), [
            set("webhookType", IntercomWebhookUserEventRead)
          ]),
          ifL(cond("isEqual", "${eventItem}", "lead"), [
            set("webhookType", IntercomWebhookLeadEventRead)
          ])
        ]),

        set("action", get("action", "${eventDefinition}")),
        ifL(cond("isEqual", "${action}", "track"), [
          set("identity", transformTo(HullUserIdentity, cast("${webhookType}", get("${pathToEntity}", "${webhookData}")))),
          ifL(cond("notEmpty", "${identity}"), [
            hull("asUser", {
              ident: "${identity}",
              events: [
                transformTo(HullIncomingEvent, cast(IntercomWebhookEventRead, "${webhookData}"))
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
            do: set("transformInput", "${webhookData}"),
            eldo: set("transformInput", get("${pathToEntity}", "${webhookData}"))
          }),
          hull("${asEntity}", transformTo("${transformTo}", cast("${webhookType}", "${transformInput}")))
        ])
      ])
    ])
};

module.exports = glue;
