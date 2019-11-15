/* @flow */

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
  not,
  jsonata,
  cacheWrap,
  moment
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HullOutgoingAccount,
  HullOutgoingUser,
  HullOutgoingDropdownOption,
  HullIncomingDropdownOption,
  HullConnectorAttributeDefinition,
  WebPayload,
  HullConnectorEnumDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { OutreachEventRead } = require("./service-objects");

const _ = require("lodash");
const { accountFields, prospectFields, eventFields } = require("./fielddefs");

// function outreach(op: string, query: any): Svc { return new Svc("outreach", op, query, null)};
// function outreach(op: string, data: any): Svc { return new Svc("outreach", op, null, data)};

function outreach(op: string, param?: any): Svc { return new Svc({ name: "outreach", op }, param) }

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
  status: ifL(cond("isEmpty", settings("access_token")),
    {
      do: {
        status: "setupRequired",
        message: "'Connector has not been authenticated. Please make sure to allow Hull to access your Outreach data by going to the \"Settings\" tab and clicking \"Login to your Outreach account\" in the \"Connect to Outreach\" section'"
      },
      eldo: [
        ifL([
          cond("isEmpty", settings("synchronized_account_segments")),
          cond("isEmpty", settings("synchronized_user_segments"))
        ], {
          status: "ok",
          message: "No data will be sent from Hull to Outreach.io because there are no whitelisted segments configured.  Please visit the connector settings page and add segments to be sent to Outreach.io."
        })
      ]
    }),
  adminHandler: {
    status: 200,
    pageLocation: "home.html",
    data: {
      name: "Outreach.io"
    }
  },
  isAuthenticated: not(cond("isEmpty", settings("access_token"))),
  fieldsOutreachProspectOutbound: transformTo(HullOutgoingDropdownOption, cast(HullConnectorAttributeDefinition, prospectFields)),
  fieldsOutreachProspectInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, prospectFields)),
  fieldsOutreachAccountOutbound: transformTo(HullOutgoingDropdownOption, cast(HullConnectorAttributeDefinition, accountFields)),
  fieldsOutreachAccountInbound: transformTo(HullIncomingDropdownOption, cast(HullConnectorAttributeDefinition, accountFields)),

  shipUpdateStart: {},

  userUpdate: ifL(route("isAuthenticated"),
    iterateL(input(), { key: "message", async: true },
      route("userUpdateStart", cast(HullOutgoingUser, "${message}"))
    )
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
          cond("notEmpty", set("existingProspect", get("[0]", outreach("getProspectsByProperty"))))
        ],
        // TODO this is broken, key and value need to be reversed, or get needs to be removed
        [set("userId", "${existingProspect.id}"), loopEndL()]
      )),
  // Link account, looks up the account, and inserts it if it doesn't exist
  // and passes the accountId back to the user being upserted so that we can link to the right account
  linkAccount:
    ifL([
        // checks to see if we have the "Link users in service" feature on
        "${connector.private_settings.link_users_in_service}",
        // makes sure we don't already have an accountId on the user, if so, then we'll just use that account id
        cond("isEmpty", set("accountId", input("account.outreach/id"))),
        or([
          // insert and link if the account is part of the account segments that we're sending
          cond("notEmpty", ld("intersection", "${connector.private_settings.synchronized_account_segments}", ld("map", input("account_segments"), "id"))),
          // or link if account_segments are not present (indication that it's a batch call)
          // and make sure that there's an actual account to link, that it's not empty {}
          cond("allTrue", [
            not(input("account_segments")),
            cond("notEmpty", input("account"))
            ])
        ])
      ],
      [
        route("accountLookup"),
        ifL(cond("isEmpty", "${accountId}"),
          // casting a user message to outgoing account, not sure if that is going to result in bugs
          // but it should use the account->outreach_account transform
          route("sendInsertAccountWithAccountId", cast(HullOutgoingAccount, input()))
        )
      ]
    ),
  sendInsertAccountWithAccountId: [
    set("insertedAccount", outreach("insertAccount", input())),
    ifL(cond("notEmpty", set("accountId", "${insertedAccount.id}")),
      hull("asAccount", "${insertedAccount}")
    )
  ],
  getProspectById: [
    set("userId", input("user.outreach/id")),
    ifL(cond("notEmpty", set("prospectFromOutreach", outreach("getProspectById"))),
      // TODO Make sure we have a unit test for this... should have the class type assigned by service
      hull("asUser", "${prospectFromOutreach}")
    )
  ],

  getProspectsById: iterateL(input(), { key: "message", async: true }, route("getProspectById", "${message}")),
  insertProspect: [
    route("linkAccount"),
    ifL(cond("notEmpty", set("userFromOutreach", outreach("insertProspect", input()))),
      hull("asUser", "${userFromOutreach}")
    )
  ],

  updateProspect: [
    route("linkAccount"),
    ifL(cond("notEmpty", set("userFromOutreach", outreach("updateProspect", input()))),
      hull("asUser", "${userFromOutreach}")
    )
  ],

  accountUpdate: ifL(route("isAuthenticated"),
    iterateL(input(), { key: "message", async: true },
      route("accountUpdateStart", cast(HullOutgoingAccount, "${message}"))
    )
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
          cond("notEmpty", set("existingAccount", get("[0]", outreach("getAccountByProperty"))))
        ],
        [
          set("accountId", "${existingAccount.id}"),
          loopEndL()
        ]
      )
    ),

  //removed a route which is nice, but still don't like having to check outputs everywhere
  // should add an implicit validation step so all this has to be is:
  // hull("asAccount", outreachSendInput("insertAccount", cast(HullOutgoingAccount, input("account")))
  insertAccount:
    ifL(cond("notEmpty", set("accountFromOutreach", outreach("insertAccount", input()))),
      hull("asAccount", "${accountFromOutreach}")
    ),

  updateAccount:
    ifL(cond("notEmpty", set("accountFromOutreach", outreach("updateAccount", input()))),
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
      route("getOwnerIdToEmailMap"),
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
      route("getStageIdMap"),
      route("getOwnerIdToEmailMap"),
      set("outreachProspects", outreach("getAllProspectsPaged")),
      hull("asUser", "${outreachProspects}"),
      ifL(cond("lessThan", ld("size", "${outreachProspects}"), 100), {
        do: loopEndL(),
        eldo: set("id_offset", inc(get("id", ld("last", "${outreachProspects}"))))
      })
    ])
  ],
  webhooks: ifL(input("body"), route("handleWebhook", cast(WebPayload, input("body")))),
  handleWebhook:
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

  ensureWebhooks: ifL(settings("access_token"),
    ifL(cond("isEmpty", "${connector.private_settings.webhook_id}"), [

      set("webhookUrl", utils("createWebhookUrl")),
      set("existingWebhooks", outreach("getAllWebhooks")),
      set("sameWebhook", filter({ type: "webhook", attributes: { url: "${webhookUrl}" } }, "${existingWebhooks}")),
      ifL("${sameWebhook[0]}", {
        do: set("webhookId", "${sameWebhook[0].id}"),
        eldo: set("webhookId", get("data.id", outreach("insertWebhook", webhookDataTemplate)))
      }),
      hull("settingsUpdate", { webhook_id:  "${webhookId}" }),
      route("deleteBadWebhooks")
    ])
  ),
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
    ]),
  getStageIdMap: jsonata("data{ $string(id): attributes.name }", cacheWrap(600, outreach("getStages"))),
  getOwnerIdToEmailMap: jsonata("data{ $string(id): attributes.email }", cacheWrap(600, outreach("getUsers"))),
  eventsMapping: [
    set("service_name", "outreach"),
    set("eventsToFetch", ld("join", settings("events_to_fetch"), ",")),
    set("last_sync", ex(ex(moment(), "utc"), "format")),
  ],
  eventsFetchAll:
    ifL(cond("notEmpty", settings("events_to_fetch")), [
      route("eventsMapping"),
      set("outreachEvents", outreach("getEvents")),
      route("getEvents")
    ]),
  eventsFetchRecent:
    ifL([
      cond("isEqual", settings("fetch_events"), true),
      cond("notEmpty", settings("events_to_fetch"))
    ], [
      route("eventsMapping"),
      ifL(cond("isEmpty", settings("events_last_fetch_st")), {
        do: set("eventsLastFetch", settings("events_last_fetch_at")),
        eldo: set("eventsLastFetch", ex(ex(ex(moment(), "subtract", { hour: 1 }), "utc"), "format"))
      }),
      set("filterLimits", "${eventsLastFetch}..${last_sync}"),
      set("outreachEvents", outreach("getRecentEvents")),
      route("getEvents"),
    ]),
  getEvents: [
    loopL([
      iterateL("${outreachEvents.data}", { key: "outreachEvent", async: true },
        hull("asUser", cast(OutreachEventRead, "${outreachEvent}"))
      ),
      ifL(cond("isEmpty", "${outreachEvents.links.next}"), {
        do: loopEndL(),
        eldo: [
          set("indexQuery", inc(ex("${outreachEvents.links.next}", "indexOf", "?"))),
          set("offsetQuery", ex("${outreachEvents.links.next}", "substr", "${indexQuery}")),
          set("outreachEvents", outreach("getEventsOffset")),
        ]
      })
    ]),
    settingsUpdate({events_last_fetch_at: "${last_sync}"})
  ]
};

module.exports = glue;
