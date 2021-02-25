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
  HullOutgoingUser
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

const glue = {
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
    cond("notEmpty", settings("access_token"))
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
  userUpdate: [
    ifL([
        cond("notEmpty", input()),
        route("isConfigured")
      ],
      set("outgoingContacts", []),
      iterateL(input(), { key: "message", async: true }, [
        ex("${outgoingContacts}", "push",
          transformTo(
            FreshsuccessContactWrite, cast(HullOutgoingUser, "${message}")
          )
        )
      ]),
      set("upsertResponse", freshsuccess("bulkUpsertContacts", cast(FreshsuccessContactWrites, "${outgoingContacts}")))
    )
  ],
  accountUpdate: [
    ifL([
        cond("notEmpty", input()),
        route("isConfigured")
      ],
      set("outgoingAccounts", []),
      iterateL(input(), { key: "message", async: true }, [
        ex("${outgoingAccounts}", "push",
          transformTo(
            FreshsuccessAccountWrite, cast(HullOutgoingAccount, "${message}")
          )
        )
      ]),
      set("upsertResponse", freshsuccess("bulkUpsertAccounts", cast(FreshsuccessAccountWrites, "${outgoingAccounts}")))
      // TODO bulk support - error handling, retries, success logs
    )
  ]
};

module.exports = glue;
