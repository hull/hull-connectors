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
  filterL,
  get,
  moment,
  cast,
  jsonata,
  settings,
  ex,
  ld
} = require("hull-connector-framework/src/purplefusion/language");

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
  setEventMap: [
    set("eventsMapping", require("./email_events")),
    set("eventsToFetch", "${connector.private_settings.events_to_fetch}")
  ],
  fetchAllEmailEvents: [
    route("setEventMap"),
    set("service_name", "hubspot"),
    set("initialEndpoint", "getAllEmailEvents"),
    set("offsetEndpoint", "getAllEmailEventsWithOffset"),
    route("getEvents")
  ],
  fetchHotOffThePressEvents: [
    route("setEventMap"),
    set("service_name", "hubspot"),
    set("startTimestamp", ex(ex(moment(), "subtract", { hours: 24 }), "valueOf")),
    set("initialEndpoint", "getRecentEmailEvents"),
    set("offsetEndpoint", "getRecentEmailEventsWithOffset"),
    route("getEvents")
  ],
  fetchRecentEmailEvents: [
    ifL("${connector.private_settings.fetch_email_events}", [
      route("setEventMap"),
      set("service_name", "hubspot"),
      ifL(cond("notEmpty", settings("events_last_fetch_started_at")), {
        do: set("startTimestamp", ex(moment(settings("events_last_fetch_started_at")), "valueOf")),
        eldo: set("startTimestamp", ex(ex(moment(), "subtract", { minutes: 6 }), "valueOf"))
      }),
      set("initialEndpoint", "getRecentEmailEvents"),
      set("offsetEndpoint", "getRecentEmailEventsWithOffset"),
      route("getEvents")
    ])
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
        events_last_fetch_started_at: "${last_sync}"
      })
    ])
  ],
  getEmailCampaignData: [
    iterateL("${hubspotResponse.events}", "hubspotEmailEvent",[
      ifL(ld("includes", "${eventsToFetch}", get("${hubspotEmailEvent.type}", "${eventsMapping}")), {
        do: [
          set("emailCampaignId", get("emailCampaignId", "${hubspotEmailEvent}")),
          ifL(cond("notEmpty", "${emailCampaignId}"), {
            do: [
              set("event_created_at", ex(moment(get("created", "${hubspotEmailEvent}")), "toISOString")),

              // get the email campaign from the email event
              ifL(cond("isEmpty", set("marketingEmailId", cacheGet("campaign-${emailCampaignId}"))), [
                set("marketingEmailId", get("contentId", hubspot("getEmailCampaign"))),
                cacheSet("campaign-${emailCampaignId}", "${marketingEmailId}"),
              ]),
              route("getMarketingEmailData")
            ],
            eldo: []
          })
        ]
      })
    ])
  ],
  getMarketingEmailData: [
    // get all marketing emails from the campaign
    ifL(cond("isEmpty", set("emailContent", cacheGet("marketing-${emailCampaignId}"))), [
      set("hubspotMarketingEmails", hubspot("getMarketingEmails")),
      set("totalEmailCampaigns", get("total", "${hubspotMarketingEmails}")),
      set("emailContent", cacheSet("marketing-${emailCampaignId}", { total: "${totalEmailCampaigns}" })),
      iterateL("${hubspotMarketingEmails.objects}", "marketingEmail", [
        set("emailContent", cacheSet("marketing-${emailCampaignId}", { total: "${totalEmailCampaigns}", body: "${marketingEmail.primaryRichTextModuleHtml}", subject: "${marketingEmail.subject}" }))
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
          token: "${refreshTokenResponse.token}"
        })
      )
    ])
};

module.exports = glue;
