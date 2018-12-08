/* @flow */
const { service } = require("./service");

const {
  ifLogic,
  route,
  cond,
  hull,
  set,
  get,
  filter,
  utils,
  input,
  inputParameter,
  Svc
} = require("./shared/language");

// function outreach(op: string, query: any): Svc { return new Svc("outreach", op, query, null)};
// function outreach(op: string, data: any): Svc { return new Svc("outreach", op, null, data)};

function outreach(op: string): Svc { return new Svc("outreach", op)};
function outreachSend(op: string, param: any): Svc { return new Svc("outreach", op, param)};
function outreachSendInput(op: string): Svc { return new Svc("outreach", op, input())};


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
// everything else doesn't have a name....

const glue = {
  userUpdateStart: route("prospectUpsert"),
  prospectUpsert:
    ifLogic(cond("notEmpty", set("userId", inputParameter("outreach/id"))), {
      true: hull("asUser", outreachSendInput("updateProspect")),
      false: [
        route("prospectLookup"),
        route("linkAccount"),
        ifLogic(cond("notEmpty", "${userId}"), {
          true: route("updateProspect"),
          false: route("insertProspect")
        }),
      ]
    }),
  prospectLookup:
    expandLogic("claim", notfilter("${connector.private_settings.incoming_prospect_claims}", { service: "id" }),
      [
        set("property", "${claim.service}"),
        set("value", get(input(), "${claim.hull}")),
        // TODO still need to see if more than 1
        ifLogic(cond("notEmpty", set("userId", get(outreach("getProspectByProperty"), "[0].id")), {
          true: expandEnd()
          false: {}
        })
      ]
    ),
  linkAccount:
    ifLogic("${connector.private_settings.link_users_in_service}", {
      true: ifLogic(intersection(map("${connector.private_settings.synchronized_account_segments}", "id"), inputParameter("account.segmentIds")), {
        true: [
          route("accountLookup"),
          ifLogic(cond("notEmpty", "${accountId}"), {
            true: route("insertAccount", inputParameter("account")),
            false: {}
          })
        ],
        false: {}
      },
      false: {}
    }),
  insertAccount: hull("asUser", outreachSendInput("insertUser")),
  updateAccount: hull("asUser", outreachSendInput("updateUser")),
  accountUpdateStart: route("accountUpsert"),
  accountUpsert:
    ifLogic(cond("notEmpty", set("accountId", inputParameter("outreach/id"))), {
      true: hull("asAccount", outreachSendInput("updateAccount")),
      false: [
        route("accountLookup"),
        ifLogic(cond("notEmpty", "${accountId}"), {
          true: route("updateAccount"),
          false: route("insertAccount")
        }),
      ]
    }),
  accountLookup:
    expandLogic("claim", notfilter("${connector.private_settings.incoming_account_claims}", { service: "id" }),
      [
        set("property", "${claim.service}"),
        set("value", get(input(), "${claim.hull}")),
        // TODO still need to see if more than 1
        ifLogic(cond("notEmpty", set("accountId", get(outreach("getAccountByProperty"), "[0].id")), {
          true: expandEnd()
          false: {}
        })
      ]
    ),
  insertAccount: hull("asAccount", outreachSendInput("insertAccount")),
  updateAccount: hull("asAccount", outreachSendInput("updateAccount")),
  fetchAll: [route("accountFetchAll"), route("prospectFetchAll")],
  accountFetchAll: hull("asAccount", outreach("getAllAccounts")),
  prospectFetchAll: hull("asUser", outreach("getAllProspects")),

  webhook:
    ifLogic(cond("isEqual", ["account", inputParameter("data.type")]), {
      true: hull("asAccount", input()),
      false:
        ifLogic(cond("isEqual", ["prospect", inputParameter("data.type")]), {
          true: hull("asUser", input()),
          false: {}
        })
    }),

  ensureWebhooks:
    ifLogic(cond("isEmpty", "${connector.private_settings.webhook_id}"), {
      true: [
        set("webhookUrl", utils("createWebhookUrl")),
        ifLogic(cond("isEmpty", filter(outreach("getAllWebhooks"), { type: "webhook", attributes: { url: "${webhookUrl}" } })),
          {
            true: [
              set("webhookId", get(outreachSend("insertWebhook", webhookDataTemplate), "data.id")),
              hull("settingsUpdate", { webhook_id:  "${webhookId}" })
            ],
            false: {}
          })
        ],
      false: {}
    }),
  refreshToken:
    ifLogic(cond("notEmpty", "${connector.private_settings.refresh_token}"), {
      true: [
        set("connectorHostname", utils("getConnectorHostname")),
        ifLogic(cond("notEmpty", set("refreshTokenResponse", outreachSend("refreshToken", refreshTokenDataTemplate))), {
          true: [
            set("connector.private_settings.expires_in", "${refreshTokenResponse.expires_in}"),
            set("connector.private_settings.created_at", "${refreshTokenResponse.created_at}"),
            set("connector.private_settings.refresh_token", "${refreshTokenResponse.refresh_token}"),
            set("connector.private_settings.access_token", "${refreshTokenResponse.access_token}"),
            hull("settingsUpdate", {
                          "expires_in": "${refreshTokenResponse.expires_in}",
                          "created_at": "${refreshTokenResponse.created_at}",
                          "refresh_token": "${refreshTokenResponse.refresh_token}",
                          "access_token": "${refreshTokenResponse.access_token}"})
          ],
          false: {}
        })
      ],
      false: {}
  })

};

module.exports = { glue };
