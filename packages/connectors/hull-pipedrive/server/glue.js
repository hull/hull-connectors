/* @flow */

import { PipedrivePersonRead, PipedriveOrgRead } from "./service-objects";

const {
  ifL,
  route,
  cond,
  settings,
  set,
  loopL,
  loopEndL,
  Svc,
  hull,
  iterateL,
  cast,
  transformTo,
  settingsUpdate,
  utils,
  ld,
  inc,
  not,
  input,
  notFilter,
  get
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  HullOutgoingDropdownOption,
  HullIncomingDropdownOption,
  HullConnectorAttributeDefinition,
  WebPayload
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");
const { orgFields, personFields } = require("./fielddefs");

function pipedrive(op: string, param?: any): Svc { return new Svc({ name: "pipedrive", op }, param) }

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  grant_type: "refresh_token"
};

const glue = {
  isAuthenticated: not(cond("isEmpty", settings("access_token"))),
  status: ifL(cond("isEmpty", settings("access_token")), {
    do: {
      status: "setupRequired",
      message: "'Connector has not been authenticated. Please make sure to allow Hull to access your Pipedrive data by going to the \"Settings\" tab and clicking \"Login to your Pipedrive account\" in the \"Connect to Pipedrive\" section'"
    },
    eldo: {
      status: "ok",
      message: "allgood"
    }
  }),
  ensureHook: set("service_name", "pipedrive"),
  accountUpdate: ifL(route("isAuthenticated"),
    iterateL(input(), { key: "message", async: true },
      route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
    )
  ),
  accountUpdateStart:
    ifL(cond("notEmpty", set("accountId", input("account.pipedrive/id"))), {
      do: route("updateAccount"),
      eldo: [
        route("accountLookup"),
        ifL(cond("notEmpty", "${accountId}"), {
          do: route("updateAccount"),
          eldo: route("insertAccount")
        }),
      ]
    }),
  accountLookup:
    iterateL(notFilter({ service: "id" }, "${connector.private_settings.account_claims}"), "claim",
      ifL([
          cond("notEmpty", set("value", input("account.${claim.hull}"))),
          cond("notEmpty", set("property", "${claim.service}")),
          cond("notEmpty", set("existingAccount", get("[0]", pipedrive("getAccountsByName"))))
        ],
        [
          set("accountId", "${existingAccount.id}"),
          loopEndL()
        ]
      )
    ),
  insertAccount:
    ifL(cond("notEmpty", set("accountFromPipedrive", pipedrive("insertAccount", input()))),
      hull("asAccount", "${accountFromPipedrive}")
    ),

  updateAccount:
    ifL(cond("notEmpty", set("accountFromPipedrive", pipedrive("updateAccount", input()))),
      hull("asAccount", "${accountFromPipedrive}")
    ),
  fetchAll: [
    route("personFetchAll"),
    route("orgFetchAll")
  ],
  personFetchAll: [
    set("start", 0),
    loopL([
      set("personPage", pipedrive("getAllPersonsPaged")),
      iterateL("${personPage.data}", { key: "pipedrivePerson", async: true },
        hull("asUser", cast(PipedrivePersonRead, "${pipedrivePerson}"))
      ),
      ifL(cond("isEqual", "${personPage.additional_data.pagination.more_items_in_collection}", false), {
          do: loopEndL(),
          eldo: set("start", inc("${start}"))
      })
    ])
  ],
  orgFetchAll: [
    set("start", 0),
    loopL([
      set("orgPage", pipedrive("getAllOrgsPaged")),
      iterateL("${orgPage.data}", { key: "pipedriveOrg", async: true},
        hull("asAccount", cast(PipedriveOrgRead, "pipedriveOrg"))
      ),
      ifL(cond("isEqual", "${orgPage.additional_data.pagination.more_items_in_collection}", false), {
          do: loopEndL(),
          eldo: set("start", inc("${start}"))
      })
    ])
  ],
  fieldsPipedrivePersonInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, personFields)),
  fieldsPipedriveOrgInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, orgFields)),
  fieldsPipedriveAccountOutbound: transformTo(HullOutgoingDropdownOption, cast(HullConnectorAttributeDefinition, orgFields)),
  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      set("refreshAuthorizationHeader", utils("base64Encode", `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)),
      ifL(cond("notEmpty", set("refreshTokenResponse", pipedrive("refreshToken", refreshTokenDataTemplate))),
          settingsUpdate({
            expires_in: "${refreshTokenResponse.expires_in}",
            refresh_token: "${refreshTokenResponse.refresh_token}",
            access_token: "${refreshTokenResponse.access_token}"
          })
        )
    ])
};

module.exports = glue;
