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
  get,
  or,
  cacheLock,
  cacheSet,
  cacheGet,
  filter
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

const webhookPersonTemplate = {
  subscription_url: "${webhookUrl}",
  event_object: "person",
  event_action: "*"
};
const webhookOrgTemplate = {
  subscription_url: "${webhookUrl}",
  event_object: "organization",
  event_action: "*"
};

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
  ensureWebhooks: [
    set("service_name", "pipedrive"),
    ifL(settings("access_token"), ifL(cond("isEmpty", "${connector.private_settings.webhook_id_person}"), [
      set("webhookUrl", utils("createWebhookUrl")),
      set("existingWebhooks", pipedrive("getAllWebhooks")),
      set("samePersonWebhook", filter({ subscription_url: "${webhookUrl}", event_object: "person" }, "${existingWebhooks}")),
      set("sameOrgWebhook", filter({ subscription_url: "${webhookUrl}", event_object: "organization" }, "${existingWebhooks}")),
      ifL("${samePersonWebhook[0]}", {
        do: [
          set("webhookIdPerson", "${samePersonWebhook[0].id}"),
          set("webhookIdOrg", "${sameOrgWebhook[0].id}")
        ],
        eldo: [
          set("webhookIdPerson", get("data.id", pipedrive("insertWebhook", webhookPersonTemplate))),
          set("webhookIdOrg", get("data.id", pipedrive("insertWebhook", webhookOrgTemplate)))
        ]
      }),
      settingsUpdate({
        webhook_id_person: "${webhookIdPerson}",
        webhook_id_org: "${webhookIdOrg}"
      }),
      route("deleteBadWebhooks")
    ]))
  ],
  deleteBadWebhooks: [

  ],
  accountUpdate: ifL(route("isAuthenticated"),
    iterateL(input(), { key: "message", async: true },
      route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
    )
  ),
  accountUpdateStart:
    cacheLock(input("account.id"),
      ifL(or([
          set("accountId", input("account.pipedrive/id")),
          set("accountId", cacheGet(input("account.id")))
        ]), {
          do: route("updateAccount"),
          eldo: route("insertAccount")
        }
      )
    ),
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
      cacheSet({ key: input("account.id") }, "${accountFromPipedrive.id}"),
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
        hull("asAccount", cast(PipedriveOrgRead, "${pipedriveOrg}"))
      ),
      ifL(cond("isEqual", "${orgPage.additional_data.pagination.more_items_in_collection}", false), {
          do: loopEndL(),
          eldo: set("start", inc("${start}"))
      })
    ])
  ],
  webhooks: [

  ],
  getOrgFields: pipedrive("getOrgFields"),
  fieldsPipedrivePersonInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, personFields)),
  fieldsPipedriveOrgInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, orgFields)),
  fieldsPipedriveAccountOutbound: transformTo(HullOutgoingDropdownOption, route("getOrgFields")),
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
    ]),
  isConfigured: cond("allTrue",[
    cond("notEmpty", settings("access_token"))
  ]),
  updateUser: ifL(route("isConfigured"),
    iterateL(input(), { key: "message", async: true }, [
      route("linkAccount", cast(HullOutgoingAccount, "${message}")),
      ifL(cond("notEmpty", set("userId", input("message.user.${service_name}/id"))), {
        do: route("updateProspect", cast(HullOutgoingUser, "${message}")),
        eldo: [
          route("personLookup"),
          ifL(cond("notEmpty", "${userId}"), {
            do: route("updateProspect", cast(HullOutgoingUser, "${message}")),
            eldo: route("insertProspect", cast(HullOutgoingUser, "${message}"))
          })
        ]
      })
    ])
  ),
  updatePerson: [
    ifL(cond("notEmpty", set("personFromPipedrive", pipedrive("updateProspect", input()))),
      hull("asUser", "${personFromPipedrive}")
    )
  ],
  insertPerson: [
    ifL(cond("notEmpty", set("personFromPipedrive", pipedrive("insertProspect", input()))),
      hull("asUser", "${personFromPipedrive}")
    )
  ],
  // Link account, looks up the account, and inserts it if it doesn't exist
  // and passes the accountId back to the user being upserted so that we can link to the right account
  linkAccount:
    ifL([
        // checks to see if we have the "Link users in service" feature on
        settings("link_users_in_service"),
        // makes sure we don't already have an accountId on the user, if so, then we'll just use that account id
        cond("isEmpty", set("accountId", input("account.${service_name}/id"))),
        or([
          // insert and link if the account is part of the account segments that we're sending
          cond("notEmpty", ld("intersection", settings("synchronized_account_segments"), ld("map", input("account_segments"), "id"))),
          // or link if account_segments are not present (indication that it's a batch call)
          // and make sure that there's an actual account to link, that it's not empty {}
          cond("allTrue", [
            not(input("account_segments")),
            cond("notEmpty", input("account"))
          ])
        ])
      ],
      route("accountUpdateStart", input())
    ),
};

module.exports = glue;
