/* @flow */

import {
  CalendlyWebhookEventRead
} from "./service-objects";
import { HullIncomingUser } from "hull-connector-framework/src/purplefusion/hull-service-objects";
const { EVENT_MAPPING } = require("./event-mapping");
const _ = require("lodash");

const {
  HullUserIdentity
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  route,
  set,
  get,
  ifL,
  Svc,
  settings,
  ex,
  cast,
  cond,
  ld,
  iterateL,
  hull,
  input,
  transformTo,
  cacheLock,
  utils,
  filter,
  settingsUpdate
} = require("hull-connector-framework/src/purplefusion/language");

function calendly(op: string, param?: any): Svc {
  return new Svc({ name: "calendly", op }, param);
}

const webhookDataTemplate = {
  "url": "${webhookUrl}",
  "events": [
    "invitee.created",
    "invitee.canceled"
  ],
  "organization": "${organization}",
  "scope": "organization"
};

const introspectTokenTemplate = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  token: "${connector.private_settings.access_token}"
};

const refreshTokenDataTemplate = {
  refresh_token: "${connector.private_settings.refresh_token}",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: "https://${connectorHostname}/auth/callback",
  grant_type: "refresh_token"
}

const glue = {
  ensure: [
    cacheLock("ensureHook", [
      // TODO need to move setting organization to oauth flow
      set("organization", settings("organization")),
      ifL([
          cond("notEmpty", settings("access_token")),
          cond("isEmpty", "${organization}")
        ], [
          set("organization", get("organization", calendly("introspect", introspectTokenTemplate))),
          hull("settingsUpdate", { organization: "${organization}" })
      ]),
      ifL(cond("isEqual", settings("receive_events"), true), [
        route("ensureWebhooks")
      ])
    ])
  ],
  ensureWebhooks: ifL([
    cond("notEmpty", settings("access_token")),
    cond("notEmpty", "${organization}"),
    cond("notEmpty", "${connector.private_settings.incoming_events}"),
    cond("isEmpty", "${connector.private_settings.webhook_id}")
  ], [
    set("webhookUrl", utils("createWebhookUrl")),
    set("existingWebhooks", calendly("getAllWebhooks")),
    set("sameWebhook", filter({ callback_url: "${webhookUrl}" }, "${existingWebhooks}")),
    ifL("${sameWebhook[0]}", {
      do: set("webhookId", "${sameWebhook[0].id}"),
      eldo: [
        set("webhookTopics", settings("incoming_events")),
        set("webhookId", get("resource.uri", calendly("insertWebhook", webhookDataTemplate)))
      ]
    }),
    hull("settingsUpdate", { webhook_id: "${webhookId}" }),
    route("deleteBadWebhooks")
  ]),
  deleteBadWebhooks: [
    set("connectorOrganization", utils("getConnectorOrganization")),
    iterateL("${existingWebhooks}", "candidateWebhook",
      ifL([
        cond("not", cond("isEqual", "${candidateWebhook.callback_url}", "${webhookUrl}")),
        ex("${candidateWebhook.callback_url}", "includes", "${connectorOrganization}"),
      ], [
        set("webhook_uri","${candidateWebhook.uri}"),
        set("webhook_uuid", ex("${webhook_uri}", "substring",
          ld("add", ex("${webhook_uri}", "lastIndexOf", "/"), 1)
        )),
        calendly("deleteWebhook")
      ])
    )
  ],
  shipUpdate: ifL([
      cond("notEmpty", settings("access_token")),
      cond("notEmpty", "${organization}")
    ], [
    calendly("me")
  ]),
  status: ifL(cond("isEmpty", settings("access_token")), {
    do: {
      status: "setupRequired",
      message: "'Connector has not been authenticated with Calendly."
    },
    eldo: [
      calendly("me"),
      {
        status: "ok",
        message: "allgood"
      }
    ]
  }),
  refreshToken: [
    ifL(cond("notEmpty", "${connector.private_settings.refresh_token}"), [
      set("connectorHostname", utils("getConnectorHostname")),
      ifL(cond("notEmpty", set("refreshTokenResponse", calendly("refreshToken", refreshTokenDataTemplate))),
        settingsUpdate({
          refresh_token: "${refreshTokenResponse.refresh_token}",
          access_token: "${refreshTokenResponse.access_token}"
        })
      )
    ]),
  ],
  isConfigured: cond("allTrue", [
    cond("notEmpty", settings("access_token"))
  ]),
  webhooks:
    ifL(cond("isEqual", settings("receive_events"), true), [
      set("webhookData", input("body")),
      set("webhookTopic", "${webhookData.event}"),

      ifL(ld("includes", settings("incoming_events"), "${webhookTopic}"), [
        set("eventSource", "calendly"),
        set("eventDefinition", get("${webhookTopic}", EVENT_MAPPING)),

        set("webhookType", "${eventDefinition.webhookType}"),
        set("pathToEntity", "${eventDefinition.pathToEntity}"),
        set("eventName", "${eventDefinition.eventName}"),
        set("propertiesMapping", "${eventDefinition.properties}"),
        set("contextMapping", "${eventDefinition.context}"),
        set("transformTo", "${eventDefinition.transformTo}"),
        set("asEntity", "${eventDefinition.asEntity}"),

        hull("asUser", transformTo("${transformTo}", cast(CalendlyWebhookEventRead, "${webhookData}")))
      ])
    ])
};

module.exports = glue;
