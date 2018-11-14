/* @flow */
const { service } = require("./service");

const {
  route,
  cond,
  hull,
  set,
  get,
  filter,
  utils,
  Cond,
  Svc
} = require("./shared/language")

function outreachQuery(op: string, query: any): Svc { return new Svc("outreach", op, query, null)};
function outreachSend(op: string, data: any): Svc { return new Svc("outreach", op, null, data)};


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

const glue = {
  userUpdateStart: {
    if: { type: "conditional", op: "notEmpty", param: "user.anonymous_id" },
    true: route("prospectLookupById"),
    false: route("prospectLookupByEmail")
  },
  prospectLookupById: {
    if: { type: "conditional", name: "notEmpty", param: { type: "service", name: "outreach", op: "getProspect" } },
    true: { type: "service", name: "hull", param: { type: "service", name: "outreach", op: "updateProspect" } },
    false: route("prospectLookupByEmail")
  },
  prospectLookupByEmail: {
    if: {
      type: "conditional",
      name: "notEmpty",
      params: {
        type: "service",
        name: "outreach",
        op: "getProspect",
        params: "email=${user.email}"
        }
      },
    true: {
      type: "service",
      name: "hull",
      op: "asUser",
      params: {
        type: "service",
        name: "outreach",
        op: "updateUser"
      }
    },
    false: {
      type: "service",
      name: "hull",
      op: "asUser",
      params: {
        type: "service",
        name: "outreach",
        op: "insertUser"
      }
    }
  },
  accountUpdateStart: {
    if: new Cond("notEmpty", "account.anonymous_id"),
      true: {
        if: new Cond("notEmpty", new Svc("outreach", "getAccountById")),
        true: new Svc("hull", "asAccount", new Svc("outreach", "updateAccount")),
        false: route("accountLookupByDomain")
      },
      false: route("accountLookupByDomain")
  },
  accountLookupByDomain: {
    if: cond("notEmpty", outreachQuery("getAccountByProperty", "domain=${account.domain}")),
    true: hull("asAccount", outreachSend("endpointType:update", "account")),
    false: hull("asAccount", outreachSend("endpointType:create", "account"))
  },

  fetchAll: [route("accountFetchAll"), route("prospectFetchAll")],
  accountFetchAll: hull("asAccount", outreachQuery("getAllAccounts")),
  prospectFetchAll: hull("asUser", outreachQuery("getAllProspects")),

  ensureWebhooks: {
    if: cond("isEmpty", "${connector.private_settings.webhook_id}"),
    true: [
      set("webhookUrl", utils("createWebhookUrl")),
      {
        if: cond("isEmpty", filter(outreachQuery("getAllWebhooks"), { type: "webhook", attributes: { url: "${webhookUrl}" } })),
        true: [
          set("webhookId", get(outreachSend("insertWebhook", webhookDataTemplate), "id")),
          hull("settingsUpdate", { webhook_id:  "${webhookId}" })
        ],
        false: {}
      }
    ]
  },
  refreshToken: {
    if: cond("notEmpty", "${connector.private_settings.refresh_token}"),
    true: [
      set("connectorHostname", utils("getConnectorHostname")),
      set("refreshTokenResponse", outreachSend("refreshToken", refreshTokenDataTemplate)),
      {
        if: (cond("notEmpty", get("refreshTokenResponse.access_token"))),
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
      }
    ],
    false: {}
  }

};

module.exports = { glue };
