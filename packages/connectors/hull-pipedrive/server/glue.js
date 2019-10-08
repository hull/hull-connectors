/* @flow */

import { PipedrivePersonRead, PipedriveOrgRead, PipedriveAttributeDefinition } from "./service-objects";

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
  filter,
  ex
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
      ifL("${samePersonWebhook[0]}", {
        do: set("webhookIdPerson", "${samePersonWebhook[0].id}"),
        eldo: set("webhookIdPerson", get("data.id", pipedrive("insertWebhook", webhookPersonTemplate))),
      }),
      settingsUpdate({
        webhook_id_person: "${webhookIdPerson}",
      }),
      ifL(not(cond("isEmpty", "${connector.private_settings.webhook_id_org}")), route("deleteBadWebhooks")),
    ])),
    ifL(settings("access_token"), ifL(cond("isEmpty", "${connector.private_settings.webhook_id_org}"), [
      set("webhookUrl", utils("createWebhookUrl")),
      set("existingWebhooks", pipedrive("getAllWebhooks")),
      set("sameOrgWebhook", filter({ subscription_url: "${webhookUrl}", event_object: "organization" }, "${existingWebhooks}")),
      ifL("${sameOrgWebhook[0]}", {
        do: set("webhookIdOrg", "${sameOrgWebhook[0].id}"),
        eldo: set("webhookIdOrg", get("data.id", pipedrive("insertWebhook", webhookOrgTemplate)))
      }),
      settingsUpdate({
        webhook_id_org: "${webhookIdOrg}"
      }),
      route("deleteBadWebhooks")
    ]))
  ],
  deleteBadWebhooks: [
    set("connectorOrganization", utils("getConnectorOrganization")),

    // Not sure I like this method of removing webhooks, think about how we might refactor
    // or add instructions to make this easier
    // TODO need to test this new pipedrive (copied from outreach) logic, this delete in particular
    iterateL("${existingWebhooks}", "candidateWebhook",
      ifL([
        cond("not", cond("isEqual", "${candidateWebhook.subscription_url}", "${webhookUrl}")),
        ex("${candidateWebhook.subscription_url}", "includes", "${connectorOrganization}"),
      ], [
        set("webhookIdToDelete","${candidateWebhook.id}"),
        pipedrive("deleteWebhook")
      ])
    )
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
    ifL(cond("notEmpty", set("accountFromPipedrive", pipedrive("insertAccount", input()))), [
      cacheSet({ key: input("account.id") }, "${accountFromPipedrive.id}"),
      hull("asAccount", "${accountFromPipedrive}")
    ]),

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
  webhooks: ifL(input("body"), route("handleWebhook", cast(WebPayload, input("body")))),
  handleWebhook:
    ifL(cond("isEqual", input("meta.action"), "deleted"), {
      do: [
        ifL(or([
            cond("isEqual", "${connector.private_settings.support_account_deletion}", true),
            cond("isEqual", "${connector.private_settings.support_user_deletion}", true),
          ]), [
            set("pipedriveId", input("meta.id")),
            set("deletedAt", input("meta.timestamp")),
            set("deletedEntity", {
              ident: {
                anonymous_id: "pipedrive:${pipedriveId}"
              },
              attributes: {
                "pipedrive/id": null,
                "pipedrive/deleted_at": "${deletedAt}"
              }
            })
          ]
        ),
        ifL([
            cond("isEqual", input("meta.object"), "person"),
            cond("isEqual", "${connector.private_settings.support_user_deletion}", true)
          ],
          hull("asUser", "${deletedEntity}")),
        ifL([
            cond("isEqual", input("meta.object"), "organization"),
            cond("isEqual", "${connector.private_settings.support_account_deletion}", true)
          ],
          hull("asUser", "${deletedEntity}"))
      ],
      eldo: [
        ifL(cond("isEqual", input("meta.object"), "person"), [
          ifL(cond("isEqual", "added", input("meta.action")),
            set("createdByWebhook", true)),
          hull("asUser", input())
        ]),
        ifL(cond("isEqual", input("meta.object"), "organization"),
          hull("asAccount", input())
        )
      ]
    }),
  fieldsPipedrivePersonInbound: transformTo(HullIncomingDropdownOption, cast(PipedriveAttributeDefinition, pipedrive("getPersonFields"))),
  fieldsPipedrivePersonOutbound: transformTo(HullOutgoingDropdownOption, cast(PipedriveAttributeDefinition, pipedrive("getPersonFields"))),
  fieldsPipedriveOrgInbound: transformTo(HullIncomingDropdownOption, cast(PipedriveAttributeDefinition, pipedrive("getOrgFields"))),
  fieldsPipedriveAccountOutbound: transformTo(HullOutgoingDropdownOption, cast(PipedriveAttributeDefinition, pipedrive("getOrgFields"))),
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
  personLookup: [
    set("userEmail", input("user.email")),
    iterateL(notFilter({ service: "id" }, settings("user_claims")), "claim",
      ifL([
          cond("notEmpty", set("value", input("user.${claim.hull}"))),
          cond("notEmpty", set("property", "${claim.service}")),
          cond("notEmpty", set("existingPerson", get("[0]", pipedrive("findPersonByEmail"))))
        ],
        // TODO this is broken, key and value need to be reversed, or get needs to be removed
        [set("userId", "${existingPerson.id}"), loopEndL()]
      ))
    ],
  userUpdate: ifL(route("isConfigured"),
    iterateL(input(), { key: "message", async: true }, [
      route("linkAccount", cast(HullOutgoingAccount, "${message}")),
      route("userUpdateStart", cast(HullOutgoingUser, "${message}"))
    ])
  ),
  userUpdateStart:
    cacheLock(input("user.id"),
      ifL(or([
          set("userId", input("user.pipedrive/id")),
          set("userId", cacheGet(input("user.id")))
        ]), {
          do: route("updateUser"),
          eldo: [
            route("personLookup"),
            ifL(cond("isEmpty", "${userId}"), {
              do: route("insertUser"),
              eldo: route("updateUser")
            })
          ]
        }
      )
    ),
  updateUser:
    ifL(cond("notEmpty", set("personFromPipedrive", pipedrive("updatePerson", input()))),
      hull("asUser", "${personFromPipedrive}")
    ),
  insertUser:
    ifL(cond("notEmpty", set("personFromPipedrive", pipedrive("insertPerson", input()))), [
      cacheSet({ key: input("user.id") }, "${personFromPipedrive.id}"),
      hull("asUser", "${personFromPipedrive}")
    ]),
  // Link account, looks up the account, and inserts it if it doesn't exist
  // and passes the accountId back to the user being upserted so that we can link to the right account
  linkAccount:
    ifL([
        // checks to see if we have the "Link users in service" feature on
        settings("link_users_in_service"),
        // makes sure we don't already have an accountId on the user, if so, then we'll just use that account id
        cond("isEmpty", set("accountId", input("account.pipedrive/id"))),
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
      route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
    ),
};

module.exports = glue;
