/* @flow */

const {
  route,
  cond,
  hull,
  set,
  utils,
  ifL,
  input,
  Svc,
  iterateL,
  cacheSet,
  cacheGet,
  settingsUpdate,
  cacheLock,
  loopL,
  loopEndL,
  get,
  moment,
  cast,
  settings,
  ex,
  ld
} = require("hull-connector-framework/src/purplefusion/language");

const { doVariableReplacement } = require("../../../hull-connector-framework/src/purplefusion/variable-utils");

const {
  HubspotIncomingEmailEvent
} = require("./service-objects");

function hubspot(op: string, param?: any): Svc {
  return new Svc({ name: "hubspot", op }, param);
}

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "",
  grant_type: "refresh_token"
};

const glue = {
  shipUpdateStart: {},
  fetchAllEmailEvents: [
    set("service_name", "hubspot"),
    set("initialEndpoint", "getAllEmailEvents"),
    set("offsetEndpoint", "getAllEmailEventsWithOffset"),
    route("getEvents")
  ],
  fetchRecentEmailEvents: [
    set("service_name", "hubspot"),
    ifL(cond("notEmpty", settings("last_fetch_started_at")), {
      do: set("startTimestamp", ex(moment(settings("last_fetch_started_at")), "valueOf")),
      eldo: set("startTimestamp", ex(ex(moment(), "subtract", { hours: 24 }), "valueOf"))
    }),
    set("initialEndpoint", "getRecentEmailEvents"),
    set("offsetEndpoint", "getRecentEmailEventsWithOffset"),
    route("getEvents")
  ],
  getEvents: [
    /*
     Hubspot Response:
      {
        "hasMore": true,
        "offset": "foo",
        "events": [...]
      }
     */
    set("limit", 300),
    ifL(cond("notEmpty", set("hubspotResponse", hubspot("${initialEndpoint}"))), [
      set("last_sync", moment()),
      set("hasMore", get("hasMore", "${hubspotResponse}")),

      loopL([
        ifL([
          "${hasMore}", cond("notEmpty", "${offset}")
        ], [
          set("hubspotResponse", hubspot("${offsetEndpoint}")),
          set("hasMore", get("hasMore", "${hubspotResponse}")),
        ]),
        route("getEmailCampaignData"),

        ifL("${hasMore}", {
          do: set("offset", get("offset", "${hubspotResponse}")),
          eldo: loopEndL()
        })
      ]),
      settingsUpdate({
        last_fetch_started_at: "${last_sync}"
      })
    ])
  ],
  getEmailCampaignData: [
    iterateL("${hubspotResponse.data.events}", "hubspotEmailEvent",[
      set("eventType", get("type", "${hubspotEmailEvent}")),

      ifL(ld("includes", "${connector.private_settings.events_to_fetch}", "${eventType}"), {
        do: [
          set("emailCampaignId", get("emailCampaignId", "${hubspotEmailEvent}")),
          set("event_created_at", ex(moment(get("created", "${hubspotEmailEvent}")), "toISOString")),

          // get the email campaign from the email event\
          set("hubspotEmailCampaign", hubspot("getEmailCampaign")),
          set("marketingEmailId", get("contentId", "${hubspotEmailCampaign}")),
          route("getMarketingEmailData")
        ]
      })
    ])
  ],
  getMarketingEmailData: [
    // get all marketing emails from the campaign
    ifL(cond("isEmpty", set("emailContent", cacheGet("${emailCampaignId}"))), [
      set("hubspotMarketingEmails", hubspot("getMarketingEmails")),
      set("totalEmailCampaigns", get("total", "${hubspotMarketingEmails}")),
      set("emailContent", cacheSet("${emailCampaignId}", { total: "${totalEmailCampaigns}" })),
      iterateL("${hubspotMarketingEmails.data.objects}", "marketingEmail", [
        set("emailContent", cacheSet("${emailCampaignId}", { total: "${totalEmailCampaigns}", body: "${marketingEmail.primaryRichTextModuleHtml}", subject: "${marketingEmail.subject}" }))
      ])
    ]),
    ifL(cond("lessThan", 0, get("total", "${emailContent}")), {
      do: route("sendEventToHull")
    })
  ],
  sendEventToHull: [
    hull("asUser", cast(HubspotIncomingEmailEvent, "${hubspotEmailEvent}"))
  ],
  refreshToken:
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      ifL(cond("notEmpty", set("refreshTokenResponse", hubspot("refreshToken", refreshTokenDataTemplate))),
        settingsUpdate({
          expires_in: "${refreshTokenResponse.expires_in}",
          refresh_token: "${refreshTokenResponse.refresh_token}",
          access_token: "${refreshTokenResponse.access_token}"
        })
      )
    ])
};

module.exports = glue;
