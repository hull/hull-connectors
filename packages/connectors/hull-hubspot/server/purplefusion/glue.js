/* @flow */

import { HubspotWebhookPayload } from "./service-objects";

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
  loopL,
  loopEndL,
  get,
  moment,
  cast,
  settings,
  ex,
  ld,
  not,
  or,
  cacheLock,
  filterL
} = require("hull-connector-framework/src/purplefusion/language");

const {
  HubspotIncomingEmailEvent
} = require("./service-objects");

function hubspot(op: string, param?: any): Svc {
  return new Svc({ name: "hubspot", op }, param);
}

function hubspotSyncAgent(op: string, param?: any): Svc {
  return new Svc({ name: "hubspot_service", op }, param);
}

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "",
  grant_type: "refresh_token"
};

const glue = {
  ensureHook: [
    set("service_name", "hubspot")
  ],
  shipUpdateStart: {},
  setEventMap: [
    set("eventsMapping", require("./email_events")),
    set("eventsToFetch", "${connector.private_settings.events_to_fetch}")
  ],
  incomingWebhooksHandler: [
    /*
      Example Payload:
      [
        {
          "eventId": 1,
          "subscriptionId": 162971,
          "portalId": 6038822,
          "occurredAt": 1567689104280,
          "subscriptionType": "contact.deletion",
          "attemptNumber": 0,
          "objectId": 123,
          "changeSource": "CRM",
          "changeFlag": "DELETED"
        }
      ]
     */
    ifL(or([settings("mark_deleted_contacts"), settings("mark_deleted_companies")]), [
      iterateL(input(), "webhookAction", [
        set("webhookSubscription", ld("split", "${webhookAction.subscriptionType}", ".")),
        set("hubspotEntity", "${webhookSubscription[0]}"),
        set("actionTaken", "${webhookAction.changeFlag}"),
        ifL(not(cond("isEqual", "${hubspotEntity}", "company")), {
          do: [
            ifL(settings("mark_deleted_contacts"), [
              hull("userDeletedInService", cast(HubspotWebhookPayload, "${webhookAction}"))
            ])
          ],
          eldo: [
            ifL([settings("handle_accounts"), settings("mark_deleted_companies")], [
              hull("accountDeletedInService", cast(HubspotWebhookPayload, "${webhookAction}"))
            ])
          ]
        })
      ])
    ])
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
        do: set("startTimestamp", settings("events_last_fetch_started_at")),
        eldo: set("startTimestamp", ex(ex(moment(), "subtract", { minutes: 5 }), "valueOf"))
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

      set("hasMore", get("hasMore", "${hubspotResponse}")),

      loopL([
        set("last_sync", ex(moment(), "valueOf")),
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

      set("events_last_fetch_timestamp", "${last_sync}"),
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
    ]),
  fetchRecentContacts:
    cacheLock("getRecentContacts",[
      set("lastFetchAt", settings("last_fetch_timestamp")),
      ifL(cond("isEmpty", "${lastFetchAt}"),
        set("lastFetchAt", ex(moment(settings("last_fetch_at")), "valueOf"))),
      ifL(cond("isEmpty", "lastFetchAt"),
        set("lastFetchAt", ex(ex(moment(), "subtract", { hour: 1 }), "valueOf"))),
      set("properties", hubspotSyncAgent("getContactPropertiesKeys")),
      set("stopFetchAt", ex(moment(), "valueOf")),
      loopL([
        set("contactsPage", hubspot("getRecentContactsPage")),
        ifL(cond("lessThan", "${contactsPage.time-offset}", "${lastFetchAt}"), {
          do:
            set("contactsToSave",
              filterL(or([
                cond("greaterThan", "${contact.addedAt}", "${lastFetchAt}"),
                cond("isEqual", "${contact.addedAt}", "${lastFetchAt}"),
              ]), "contact", "${contactsPage.contacts}")),
          eldo: set("contactsToSave", "${contactsPage.contacts}")
        }),
        ifL(cond("notEmpty", "${contactsToSave}"),
          hubspotSyncAgent("saveContacts", "${contactsToSave}")),
        ifL(
          or([
            cond("isEqual", "${contactsPage.has-more}", false),
            cond("greaterThan", "${lastFetchAt}", "${contactsPage.time-offset}"),
            cond("isEqual", "${lastFetchAt}", "${contactsPage.time-offset}")
          ]),
          loopEndL()
        ),
        set("vidOffset", "${contactsPage.vid-offset}"),
        set("timeOffset", "${contactsPage.time-offset}"),
        set("contactsPage", []),
      ]),
      settingsUpdate({last_fetch_timestamp: "${stopFetchAt}"}),
      ifL(cond("notEmpty", settings("last_fetch_at")),
        settingsUpdate({last_fetch_at: null}))
    ])
};

module.exports = glue;
