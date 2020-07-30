/* @flow */

import {
  IntercomIncomingCompany,
  IntercomIncomingLead,
  IntercomIncomingUser,
  IntercomAttributeDefinition
} from "./service-objects";
import { filterL, inc } from "hull-connector-framework/src/purplefusion/language";
const {
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const defaultContactFields = require("../lib/fields/default-contact-fields.json");
const defaultCompanyFields = require("../lib/fields/default-company-fields.json");

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
  transformTo
} = require("hull-connector-framework/src/purplefusion/language");

function intercom(op: string, param?: any): Svc {
  return new Svc({ name: "intercom", op }, param);
}

const glue = {
  ensureHook: [
    set("intercomApiVersion", "2.1"),
    set("service_name", "intercom")
  ],
  fieldsContactInbound: returnValue([
      set("contactInboundFields", ld("concat", defaultContactFields, intercom("getContactFields")))
    ],
    transformTo(HullIncomingDropdownOption, cast(IntercomAttributeDefinition, "${contactInboundFields}"))
  ),
  fieldsContactOutbound: returnValue([
      set("contactOutboundFields", ld("concat", defaultContactFields, intercom("getContactFields")))
    ],
    transformTo(HullOutgoingDropdownOption, cast(IntercomAttributeDefinition, "${contactOutboundFields}"))
  ),
  fieldsCompanyInbound: returnValue([
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
          hull("asAccount", cast(IntercomIncomingCompany, "${intercomCompany}"))
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
          hull("asAccount", cast(IntercomIncomingCompany, "${intercomCompany}"))
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
            { "field": "role", "operator": "=", "value": "${service_entity}" }
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
      set("service_entity", "lead"),
      set("transformTo", IntercomIncomingLead),
      set("lastFetchAt", settings("leads_last_fetch_timestamp")),
      settingsUpdate({ leads_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchRecentUsers: ifL(
    cond("allTrue", [
      route("isConfigured"),
      settings("fetch_users")
    ]), [
      set("service_entity", "user"),
      set("transformTo", IntercomIncomingUser),
      set("lastFetchAt", settings("users_last_fetch_timestamp")),
      settingsUpdate({ users_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchAllLeads: ifL(
    cond("allTrue", [
      route("isConfigured")
    ]), [
      set("service_entity", "lead"),
      set("transformTo", IntercomIncomingLead),
      set("lastFetchAt", 0),
      set("fetchAll", true),
      settingsUpdate({ leads_last_fetch_timestamp: ex(moment(), "unix") }),
      route("fetchContacts")
    ]),
  fetchAllUsers: ifL(
    cond("allTrue", [
      route("isConfigured")
    ]), [
      set("service_entity", "user"),
      set("transformTo", IntercomIncomingUser),
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
  ], intercom("getCompanySegments"))
};

module.exports = glue;
























