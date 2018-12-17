/* @flow */
const { service } = require("./service");

const {
  ifLogic,
  route,
  routeWithData,
  cond,
  hull,
  set,
  get,
  filter,
  notFilter,
  utils,
  loopLogic,
  loopArrayLogic,
  loopEnd,
  input,
  inputParameter,
  execute,
  Svc
} = require("./shared/language");

const {
  isUndefinedOrNull
} = require("./shared/utils");

const {
  HullOutgoingAccount,
  HullOutgoingUser
} = require("./shared/hull-service-objects");

const _ = require("lodash");

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
    ifLogic(cond("notEmpty", set("userId", inputParameter("user.outreach/id"))), {
      true: route("updateProspect"),
      false: [
        route("prospectLookup"),
        ifLogic(cond("notEmpty", "${userId}"), {
          true: route("updateProspect"),
          false: route("insertProspect")
        }),
      ]
    }),
  prospectLookup:
    loopArrayLogic(notFilter("${connector.private_settings.user_claims}", { service: "id" }), "claim",
      [
        set("property", "${claim.service}"),
        set("value", inputParameter("user.${claim.hull}")),
        // TODO still need to see if more than 1
        ifLogic(cond("notEmpty", "${value}"), {
          true: ifLogic(cond("notEmpty", set("userId", get(outreach("getProspectsByProperty"), "[0].id"))), {
                  true: loopEnd(),
                  false: {}
                }),
          false: {}
        })
      ]
    ),
  linkAccount:
    ifLogic("${connector.private_settings.link_users_in_service}", {
      // TODO maybe pass a variable through in the context, to tell it to link or not...
      // then don't have to add all of this intersection/map nonsense
      true: ifLogic(
        cond("notEmpty",
          execute(["${connector.private_settings.synchronized_account_segments}", inputParameter("account_segments")],
            (params) => {
              if (!isUndefinedOrNull(params) && Array.isArray(params) && Array.isArray(params[0]) && Array.isArray(params[1])) {
                return _.intersection(params[0], params[1].map((param) => param.id));
              }
              return [];
            })), {
        true:
          ifLogic(cond("isEmpty", set("accountId", inputParameter("account.outreach/id"))), {
            true: [
              route("accountLookup"),
              ifLogic(cond("isEmpty", "${accountId}"), {
                true: routeWithData("sendInsertAccountWithAccountId", inputParameter("account"), HullOutgoingAccount),
                false: {}
              })
            ],
            false: {}
          }),
        false: {}
      }),
      false: {}
    }),
  sendInsertAccountWithAccountId: [
    set("insertedAccount", outreachSendInput("insertAccount")),
    set("accountId", get("${insertedAccount}", "id")),
    hull("asAccount", "${insertedAccount}")
  ],
  insertProspect: [ route("linkAccount"), routeWithData("sendInsertProspect", inputParameter("user"), HullOutgoingUser) ],
  sendInsertProspect: hull("asUser", outreachSendInput("insertProspect")),
  updateProspect: [ route("linkAccount"), routeWithData("sendUpdateProspect", inputParameter("user"), HullOutgoingUser) ],
  sendUpdateProspect: hull("asUser", outreachSendInput("updateProspect")),
  accountUpdateStart: route("accountUpsert"),
  accountUpsert:
    ifLogic(cond("notEmpty", set("accountId", inputParameter("account.outreach/id"))), {
      true: route("updateAccount"),
      false: [
        route("accountLookup"),
        ifLogic(cond("notEmpty", "${accountId}"), {
          true: route("updateAccount"),
          false: route("insertAccount")
        }),
      ]
    }),
  accountLookup:
    loopArrayLogic(notFilter("${connector.private_settings.account_claims}", { service: "id" }), "claim",
      [
        set("property", "${claim.service}"),
        set("value", inputParameter("account.${claim.hull}")),
        ifLogic(cond("notEmpty", "${value}"), {
          true: ifLogic(cond("notEmpty", set("accountId", get(outreach("getAccountByProperty"), "[0].id"))), {
            true: loopEnd(),
            false: {}
          }),
          false: {}
        })
      ]
    ),
  insertAccount: routeWithData("sendInsertAccount", inputParameter("account"), HullOutgoingAccount),
  sendInsertAccount: hull("asAccount", outreachSendInput("insertAccount")),
  updateAccount: routeWithData("sendUpdateAccount", inputParameter("account"), HullOutgoingAccount),
  sendUpdateAccount: hull("asAccount", outreachSendInput("updateAccount")),

  fetchAll: [route("accountFetchAll"), route("prospectFetchAll")],
  accountFetchAll:
    [
    set("id_offset", 0),
    loopLogic(
      [
        set("outreachAccounts", outreach("getAllAccountsPaged")),
        hull("asAccount", "${outreachAccounts}"),
        ifLogic(cond("lessThan", [execute("${outreachAccounts}", (accounts) => accounts.length), 100]), {
          true: loopEnd(),
          false: set("id_offset",
                    execute(
                      get(execute("${outreachAccounts}", (accounts) => accounts[accounts.length - 1]), "id"),
                      (accountId) => accountId + 1))
        })
      ])
    ],
  prospectFetchAll:
    [
    set("id_offset", 0),
    loopLogic(
      [
        set("outreachProspects", outreach("getAllProspectsPaged")),
        hull("asUser", "${outreachProspects}"),
        ifLogic(cond("lessThan", [execute("${outreachProspects}", (prospects) => prospects.length), 100]), {
          true: loopEnd(),
          false: set("id_offset",
                    execute(
                      get(execute("${outreachProspects}", (prospects) => prospects[prospects.length - 1]), "id"),
                      (prospectId) => prospectId + 1))
        })
      ])
    ],
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
        set("existingWebhooks", outreach("getAllWebhooks")),
        ifLogic(cond("isEmpty", filter("${existingWebhooks}", { type: "webhook", attributes: { url: "${webhookUrl}" } })),
          {
            true: [
              set("webhookId", get(outreachSend("insertWebhook", webhookDataTemplate), "data.id")),
              hull("settingsUpdate", { webhook_id:  "${webhookId}" })
            ],
            false: {}
          }),
        route("deleteBadWebhooks")
        ],
      false: {}
    }),
  deleteBadWebhooks:
    ifLogic(cond("notEmpty", set("webhooksToDelete",
    execute([notFilter("${existingWebhooks}", { type: "webhook", attributes: { url: "${webhookUrl}" } }), utils("getConnectorOrganization")],
                                                      (params) => {
                                                        const webhooks = params[0] || [];
                                                        const organization = params[1];
                                                        return _.reduce(webhooks, (orgWebhooks, webhook) => {
                                                          const url = _.get(webhook, "attributes.url");
                                                          if (!_.isEmpty(url) && url.indexOf(organization) > 0) {
                                                            orgWebhooks.push(webhook);
                                                          }
                                                          return orgWebhooks;
                                                        }, []);
                                                      }))), {
      true: loopArrayLogic("${webhooksToDelete}", "badWebhook",
        [
          set("webhookIdToDelete", get("${badWebhook}", "id")),
          outreachSend("deleteWebhook")
        ]),
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
