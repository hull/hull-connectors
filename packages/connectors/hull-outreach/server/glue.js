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
} = require("./shared/language")

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
  userUpdateStart: route("prospectLookupById"),
  prospectLookupById:
    ifLogic(cond("notEmpty", set("userId", inputParameter("outreach/id"))), {
      true: ifLogic(cond("notEmpty", outreach("getProspectById")), {
              true: hull("asUser", outreachSendInput("updateProspect")),
              false: route("prospectLookupByEmail")
            }),
      false: route("prospectLookupByEmail")
    }),
  prospectLookupByEmail:
    ifLogic(cond("notEmpty", set("userEmail", inputParameter("email"))), {
      true: ifLogic(cond("notEmpty", set("userId", get(outreach("getProspectByEmail"), "id"))), {
              true: hull("asUser", outreachSendInput("updateProspect")),
              false: hull("asUser", outreachSendInput("insertProspect"))
            }),
      false: hull("asUser", outreachSendInput("insertProspect"))
    }),
  accountUpdateStart:
    ifLogic(cond("notEmpty", set("accountId", inputParameter("outreach/id"))), {
      true:
        ifLogic(cond("notEmpty", outreach("getAccountById")), {
          true: hull("asAccount", outreachSendInput("updateAccount")),
          false: route("accountLookupByDomain")
          }),
      false: route("accountLookupByDomain")
    }),
  accountLookupByDomain:
    ifLogic(cond("notEmpty", set("accountDomain", inputParameter("domain"))), {
      true: ifLogic(cond("notEmpty", outreach("getAccountByDomain")), {
              true: hull("asAccount", outreachSendInput("updateAccount")),
              false: hull("asAccount", outreachSendInput("insertAccount"))
            }),
      false: hull("asAccount", outreachSendInput("insertAccount"))
    }),
  fetchAll: [route("accountFetchAll"), route("prospectFetchAll")],
  accountFetchAll: hull("asAccount", outreach("getAllAccounts")),
  prospectFetchAll: hull("asUser", outreach("getAllProspects")),

  webhook:
    ifLogic(cond("isEqual", ["account", get("data.type", input())]), {
      true: hull("asAccount", input()),
      false:
        ifLogic(cond("isEqual", ["prospect", get("data.type", input())]), {
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
