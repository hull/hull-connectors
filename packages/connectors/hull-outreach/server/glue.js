/* @flow */
const { service } = require("./service");

const {
  ifL,
  route,
  cond,
  hull,
  set,
  get,
  filter,
  notFilter,
  utils,
  loopL,
  iterateL,
  loopEndL,
  input,
  inc,
  Svc,
  settings,
  cast,
  ex,
  ld,
  settingsUpdate,
  transformTo,
  or,
  not
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  HullOutgoingDropdownOption,
  HullIncomingDropdownOption,
  HullConnectorAttributeDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const _ = require("lodash");

// function outreach(op: string, query: any): Svc { return new Svc("outreach", op, query, null)};
// function outreach(op: string, data: any): Svc { return new Svc("outreach", op, null, data)};

function outreach(op: string, param?: any): Svc { return new Svc({ name: "outreach", op }, param)};


// TODO need support for parallel paths too
// arrays of objects paths or just object
// Think about objects (class defs) vs pipes (type defs)
// Objects don't just define a shape, they're a specific type that must be translated
// where as pipes (transforms and endpoints) just define behaviors

const webhookDataTemplate = {
      data: {
        type: "webhook",
        attributes: {
          url: "${webhookUrl}"
        }
      }
    };

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "https://${connectorHostname}/auth/callback",
  grant_type: "refresh_token"
}

// conditionals are a specific type of instruction
// who can only be executed if inside of an "if" instruction....
// everything else can be nested, which means, the if/else
// flow is special somehow....

// glue is a list of routes....
// a route has a name, and a parameter to be evaluated....
// a route is a named instruction....
// everything else doesn't have a name....\


const glue = {
  status: {},
  fieldsOutreachProspectOut: transformTo(HullOutgoingDropdownOption, cast(HullConnectorAttributeDefinition, require("./prospect-fielddefs"))),
  fieldsOutreachProspectIn: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, require("./prospect-fielddefs"))),
  fieldsOutreachAccountOut: transformTo(HullOutgoingDropdownOption, cast(HullConnectorAttributeDefinition, require("./account-fielddefs"))),
  fieldsOutreachAccountIn: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, require("./account-fielddefs"))),

  shipUpdateStart: {},

  userUpdate: iterateL(input(), { value: "message", async: true },
    route("userUpdateStart", cast(HullOutgoingUser, "${message}"))
  ),

  userUpdateStart:
    ifL(cond("notEmpty", set("userId", input("user.outreach/id"))), {
      do: [
        // checking this condition because in order to sync the email right
        // have to combine an array of the existing emails with the new one in hull
        ifL(cond("notEmpty", input("changes.user.email[1]")),
          set("existingProspect", outreach("getProspectById"))
        ),
        route("updateProspect")
      ],
      eldo: [
        route("prospectLookup"),
        ifL(cond("notEmpty", "${userId}"), {
          do: route("updateProspect"),
          eldo: route("insertProspect")
        })
      ]
    }),
  prospectLookup:
    iterateL(notFilter({ service: "id" }, settings("user_claims")), "claim",
      ifL([
          cond("notEmpty", set("value", input("user.${claim.hull}"))),
          cond("notEmpty", set("property", "${claim.service}")),
          cond("notEmpty", set("existingProspect", get(outreach("getProspectsByProperty"), "[0]")))
        ],
        // TODO this is broken, key and value need to be reversed, or get needs to be removed
        [set("userId", get("${existingProspect}", "id")), loopEndL()]
      )),
  linkAccount:
  // TODO maybe pass a variable through in the context, to tell it to link or not...
  // then don't have to add all of this intersection/map nonsense
    ifL([
        "${connector.private_settings.link_users_in_service}",
        cond("isEmpty", set("accountId", input("account.outreach/id"))),
        // must be intersecting or the account_segment is undefined, indicating that it's a batch call
        // as opposed to [] which just says the account isn't in any segments TODO test
        or(
          cond("notEmpty", ld("intersection", "${connector.private_settings.synchronized_account_segments}", input("account_segments"))),
          not(input("account_segments"))
        )
      ],
      [
        route("accountLookup"),
        ifL(cond("isEmpty", "${accountId}"),
          route("sendInsertAccountWithAccountId", cast(HullOutgoingAccount, input("account")))
        )
      ]
    ),
  sendInsertAccountWithAccountId: [
    set("insertedAccount", outreach("insertAccount", input())),
    set("accountId", get("${insertedAccount}", "id")),
    hull("asAccount", "${insertedAccount}")
  ],
  getProspectById: [
    set("userId", get(input(), "user.outreach/id")),
    ifL(cond("notEmpty", set("prospectFromOutreach", outreach("getProspectById"))),
      // TODO Make sure we have a unit test for this... should have the class type assigned by service
      hull("asUser", "${prospectFromOutreach}")
    )
  ],
  insertProspect: [
    route("linkAccount"),
    ifL(cond("notEmpty", set("userFromOutreach", outreach("insertProspect", cast(HullOutgoingUser, input("user"))))),
      hull("asUser", "${userFromOutreach}")
    )
  ],

  updateProspect: [
    route("linkAccount"),
    ifL(cond("notEmpty", set("userFromOutreach", outreach("updateProspect", cast(HullOutgoingUser, input("user"))))),
      hull("asUser", "${userFromOutreach}")
    )
  ],

  accountUpdate: iterateL(input(), { value: "message", async: true },
    route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
  ),
  accountUpdateStart:
    ifL(cond("notEmpty", set("accountId", input("account.outreach/id"))), {
      do: route("updateAccount"),
      eldo: [
        route("accountLookup"),
        ifL(cond("notEmpty", "${accountId}"), {
          do: route("updateAccount"),
          eldo: route("insertAccount")
        }),
      ]
    }),
  // May want to consider updating account if we found it with an id? especially when sending a batch user with this account
  // this may be another explaination for duplicates accounts created when we do a batch push, we shouldn't be creating the account anyway...
  // only linking if it exists?
  accountLookup:
    iterateL(notFilter({ service: "id" }, "${connector.private_settings.account_claims}"), "claim",
      ifL([
          cond("notEmpty", set("value", input("account.${claim.hull}"))),
          cond("notEmpty", set("property", "${claim.service}")),
          cond("notEmpty", set("existingAccount", get(outreach("getAccountByProperty"), "[0]")))
        ],
        [
          set("accountId", get("${existingAccount}", "id")),
          loopEndL()
        ]
      )
    ),

  //removed a route which is nice, but still don't like having to check outputs everywhere
  // should add an implicit validation step so all this has to be is:
  // hull("asAccount", outreachSendInput("insertAccount", cast(HullOutgoingAccount, input("account")))
  insertAccount:
    ifL(cond("notEmpty", set("accountFromOutreach", outreach("insertAccount", cast(HullOutgoingAccount, input("account"))))),
      hull("asAccount", "${accountFromOutreach}")
    ),

  updateAccount:
    ifL(cond("notEmpty", set("accountFromOutreach", outreach("updateAccount", cast(HullOutgoingAccount, input("account"))))),
      hull("asAccount", "${accountFromOutreach}")
    ),

  fetchAll: [
    route("accountFetchAll"),
    route("prospectFetchAll")
  ],

  //TODO run noop tests to see if this works...
  accountFetchAll: [
    set("id_offset", 0),
    loopL([
      set("outreachAccounts", outreach("getAllAccountsPaged")),
      hull("asAccount", "${outreachAccounts}"),
      ifL(cond("lessThan", ld("size", "${outreachAccounts}"), 100), {
        do: loopEndL(),
        eldo: set("id_offset", inc(get("id", ld("last", "${outreachAccounts}"))))
      })
    ])
  ],
  prospectFetchAll: [
    set("id_offset", 0),
    loopL([
      set("outreachProspects", outreach("getAllProspectsPaged")),
      hull("asUser", "${outreachProspects}"),
      ifL(cond("lessThan", ld("size", "${outreachProspects}"), 100), {
        do: loopEndL(),
        eldo: set("id_offset", inc(get("id", ld("last", "${outreachProspects}"))))
      })
    ])
  ],
  webhook:
    ifL(cond("isEqual", "account", input("data.type")), {
      do: hull("asAccount", input()),
      eldo:
        ifL(cond("isEqual", "prospect", input("data.type")), [
          ifL(cond("isEqual", "prospect.created", input("meta.eventName")),
            set("createdByWebhook", true)
          ),
          hull("asUser", input())
        ])
    }),

  ensureWebhooks:
    ifL(cond("isEmpty", "${connector.private_settings.webhook_id}"), [

      set("webhookUrl", utils("createWebhookUrl")),
      set("existingWebhooks", outreach("getAllWebhooks")),
      set("sameWebhook", filter({ type: "webhook", attributes: { url: "${webhookUrl}" } }, "${existingWebhooks}")),
      ifL("sameWebhook[0]", {
        do: set("webhookId", get("sameWebhook[0].id")),
        eldo: set("webhookId", get(outreach("insertWebhook", webhookDataTemplate), "data.id"))
      }),
      hull("settingsUpdate", { webhook_id:  "${webhookId}" }),
      route("deleteBadWebhooks")
    ]),
  deleteBadWebhooks: [
    set("connectorOrganization", utils("getConnectorOrganization")),

    // Not sure I like this method of removing webhooks, think about how we might refactor
    // or add instructions to make this easier
    //TODO need to test this new outreach logic, this delete in particular
    iterateL("${existingWebhooks}", "candidateWebhook",
      ifL([
        cond("not", cond("isEqual", "${candidateWebhook.attributes.url}", "${webhookUrl}")),
        ex("${candidateWebhook.attributes.url}", "includes", "${connectorOrganization}"),
      ], [
        set("webhookIdToDelete","${candidateWebhook.id}"),
        outreach("deleteWebhook")
      ])
    )
  ],
  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      ifL(cond("notEmpty", set("refreshTokenResponse", outreach("refreshToken", refreshTokenDataTemplate))),
        settingsUpdate({
          expires_in: "${refreshTokenResponse.expires_in}",
          created_at: "${refreshTokenResponse.created_at}",
          refresh_token: "${refreshTokenResponse.refresh_token}",
          access_token: "${refreshTokenResponse.access_token}"
        })
      )
    ])

};

module.exports = glue;
