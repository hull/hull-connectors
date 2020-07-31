/* @flow */

import {
  IntercomUserRead,
  IntercomLeadRead,
  IntercomCompanyRead,
  IntercomAttributeDefinition
} from "./service-objects";
import { filterL, inc } from "hull-connector-framework/src/purplefusion/language";

const _ = require("lodash");

const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullOutgoingUser,
  HullOutgoingEvent
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
  notFilter,
  not,
  utils,
  filter
} = require("hull-connector-framework/src/purplefusion/language");

function intercom(op: string, param?: any): Svc {
  return new Svc({ name: "intercom", op }, param);
}

const glue = {
  ensure: [
    set("intercomApiVersion", "2.1"),
    set("service_name", "intercom")
  ],
  deleteContact: [],
  deleteUser: [],
  contactFieldsInbound: returnValue([
      set("contactInboundFields", ld("concat", defaultContactFields, intercom("getContactFields")))
    ],
    transformTo(HullIncomingDropdownOption, cast(IntercomAttributeDefinition, "${contactInboundFields}"))
  ),
  contactFieldsOutbound: returnValue([
      set("contactOutboundFields", ld("concat", defaultContactFields, intercom("getContactFields")))
    ],
    transformTo(HullOutgoingDropdownOption, cast(IntercomAttributeDefinition, "${contactOutboundFields}"))
  ),
  companyFieldsInbound: returnValue([
      set("companyInboundFields", ld("concat", defaultCompanyFields, intercom("getCompanyFields")))
    ],
    transformTo(HullIncomingDropdownOption, cast(IntercomAttributeDefinition, "${companyInboundFields}"))
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
  fetchRecentCompanies: ifL(
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
        set("page", intercom("getRecentCompanies")),
        set("intercomCompanies", filterL(or([
          cond("greaterThan", "${company.updated_at}", "${lastFetchAt}"),
          cond("isEqual", "${company.updated_at}", "${lastFetchAt}")
        ]), "company", "${page.data}")),
        iterateL("${intercomCompanies}", { key: "intercomCompany", async: true},
          hull("asAccount", cast(IntercomCompanyRead, "${intercomCompany}"))
        ),
        ifL(or([
          cond("isEqual", "${page.pages.next}", null),
          cond("lessThan", get("updated_at", ld("last", "${page.data}")), "${lastFetchAt}")
        ]), loopEndL()),
        set("pageOffset", inc("${pageOffset}"))
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
          set("contactId", input("user.intercom_${service_type}/id")),
          set("contactId", cacheGet(input("user.id")))
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
    ifL(cond("notEmpty", set("contactFromIntercom", intercom("${updateRoute}", input()))),
      [
        hull("asUser","${contactFromIntercom}"),
        ifL(cond("notEmpty", settings("outgoing_events")), [
          route("sendEvents")
        ]),
        ifL(cond("isEqual", settings("tag_contacts"), true), [
          route("handleContactTags")
        ])
      ]
    )
  ],
  insertContact: [
    set("insertRoute", ld("camelCase", "insert_${service_type}")),
    ifL(cond("notEmpty", set("contactFromIntercom", intercom("${insertRoute}", input()))),
      [
        hull("asUser","${contactFromIntercom}"),
        ifL(cond("notEmpty", settings("outgoing_events")), [
          route("sendEvents")
        ]),
        ifL(cond("isEqual", settings("tag_contacts"), true), [
          route("handleContactTags")
        ])
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
  handleContactTags: [
    set("allTags", intercom("getAllTags")),

    set("contactId", "${contactFromIntercom.id}"),
    set("contactTags", ld("map", intercom("getContactTags"), "name")),

    set("segmentsEntered", ld("map", input("changes.segments.entered"), "name")),
    set("segmentsLeft", ld("map", input("changes.segments.left"), "name")),

    iterateL("${segmentsEntered}", "segmentName", [
      set("existingTag", filter({ name: "${segmentName}" }, "${allTags}")),
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
  ]
};

module.exports = glue;
























