/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  isEqual,
  mappingExists,
  notNull,
  isNull,
  not,
  resolveIndexOf
} = require("hull-connector-framework/src/purplefusion/conditionals");


const {
  HullIncomingUser,
  HullIncomingAccount,
  WebPayload,
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { isUndefinedOrNull } = require("hull-connector-framework/src/purplefusion/utils");

const {
  OutreachProspectRead,
  OutreachAccountRead,
  OutreachEventRead,
  OutreachWebEventRead
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms =
  [
    {
      input: OutreachProspectRead,
      output: HullIncomingUser,
      direction: "incoming",
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "relationships.stage.data.id", name: "stageId" },
          condition: mappingExists("incoming_user_attributes", { service: "stageName" }),
          then: [
            {
              operateOn: { component: "glue", route: "getStageIdMap", select: "${stageId}" },
              writeTo: { path: "attributes.stageName" }
            },
            {
              writeTo: {
                condition: isEqual("stageId", null),
                path: "attributes.stageName"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "relationships.stage.data.id" },
          condition: mappingExists("incoming_user_attributes", { service: "stage" }),
          writeTo: { path: "attributes.stage" }
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          condition: mappingExists("incoming_user_attributes", { service: "ownerEmail" }),
          operateOn: { component: "input", select: "relationships.owner.data.id", name: "ownerId" },
          then: [
            {
              operateOn: { component: "glue", route: "getOwnerIdToEmailMap", select: "${ownerId}" },
              writeTo: { path: "attributes.ownerEmail" }
            },
            {
              writeTo: {
                condition: isEqual("ownerId", null),
                path: "attributes.ownerEmail"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "relationships.owner.data.id" },
          condition: mappingExists("incoming_user_attributes", { service: "owner" }),
          writeTo: { path: "attributes.owner" }
        },
        {
          strategy: "PropertyKeyedValue",
          arrayStrategy: "append_index",
          transforms: [
            { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
            {
              inputPath: "id",
              outputPath: "attributes.outreach/id",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              condition: "connector.private_settings.link_users_in_hull",
              inputPath: "relationships.account.data.id",
              outputPath: "accountIdent.anonymous_id",
              outputFormat: "outreach:${value}"
            },
            {
              mapping: "connector.private_settings.incoming_user_attributes",
              allowNull: true,
              inputPath: "attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              arrayStrategy: "pick_first",
              mapping: "connector.private_settings.user_claims",
              inputPath: "attributes.${service_field_name}",
              outputPath: "ident.${hull_field_name}",
            }
          ]
        }
      ]
    },
    {
      input: OutreachWebEventRead,
      output: ServiceUserRaw,
      direction: "incoming",
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "input" },
          operateOn: { component: "input", select: "data.relationships.stage.id", name: "stageId" },
          then: [
            {
              operateOn: { component: "glue", route: "getStageIdMap", select: "${stageId}" },
              writeTo: { path: "changed_to" }
            },
          ]
        },
        {
          strategy: "PropertyKeyedValue",
          arrayStrategy: "append_index",
          transforms: [
            { inputPath: "data.id", outputPath: "id"},
            { inputPath: "changed_to", outputPath: "hull_events[0].properties.changed_to"},
            {
              outputPath: "hull_events[0].eventName",
              outputFormat: "Prospect Stage Changed"
            },
            {
              inputPath: "data.attributes.updatedAt",
              outputPath: "hull_events[0].context.created_at"
            }
          ]
        }
      ]
    },
    {
      input: WebPayload,
      output: HullIncomingUser,
      strategy: "MixedTransforms",
      direction: "incoming",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          condition: mappingExists("incoming_user_attributes", { service: "stageName" }),
          operateOn: { component: "input", select: "data.relationships.stage.id", name: "stageId" },
          then: [
            {
              operateOn: { component: "glue", route: "getStageIdMap", select: "${stageId}" },
              writeTo: { path: "data.attributes.stageName" }
            },
            {
              // need to provision for if this was unset and it's null
              writeTo: {
                condition: isEqual("stageId", null),
                path: "data.attributes.stageName"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          condition: mappingExists("incoming_user_attributes", { service: "stage" }),
          operateOn: { component: "input", select: "data.relationships.stage.id" },
          writeTo: { path: "data.attributes.stage" }
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          condition: mappingExists("incoming_user_attributes", { service: "ownerEmail" }),
          operateOn: { component: "input", select: "data.relationships.owner.id", name: "ownerId" },
          then: [
            {
              operateOn: { component: "glue", route: "getOwnerIdToEmailMap", select: "${ownerId}" },
              writeTo: { path: "data.attributes.ownerEmail" }
            },
            {
              // need to provision for if this was unset and it's null
              writeTo: {
                condition: isEqual("ownerId", null),
                path: "data.attributes.ownerEmail"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          condition: mappingExists("incoming_user_attributes", { service: "owner" }),
          operateOn: { component: "input", select: "data.relationships.owner.id" },
          writeTo: { path: "data.attributes.owner" }
        },
        {
          strategy: "PropertyKeyedValue",
          arrayStrategy: "append_index",
          transforms: [
            { inputPath: "data.id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
            { inputPath: "data.id", outputPath: "attributes.outreach/id",
              outputFormat: {
                value: "${value}",
                operation: "set"
                }
            },
            {
              condition: "connector.private_settings.link_users_in_hull",
              //This is something that's specifically different in the webhook
              // in the normal pull, it's relationships.account.data.id
              inputPath: "data.relationships.account.id",
              outputPath: "accountIdent.anonymous_id",
              outputFormat: "outreach:${value}"
            },
            { mapping: "connector.private_settings.incoming_user_attributes",
              inputPath: "data.attributes.${service_field_name}",
              allowNull: true,
              outputPath: "attributes.${hull_field_name}",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              arrayStrategy: "pick_first",
              mapping: "connector.private_settings.user_claims",
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "ident.${hull_field_name}",
            },
            {
              condition: "createdByWebhook",
              outputPath: "attributes.outreach/created_by_webhook",
              outputFormat: {
                value: "${createdByWebhook}",
                operation: "set"
              }
            }
          ]
        }
      ]
    },
    {
      input: OutreachAccountRead,
      output: HullIncomingAccount,
      direction: "incoming",
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "relationships.owner.data.id", name: "ownerId" },
          condition: mappingExists("incoming_account_attributes", { service: "ownerEmail" }),
          then: [
            {
              operateOn: { component: "glue", route: "getOwnerIdToEmailMap", select: "${ownerId}" },
              writeTo: { path: "attributes.ownerEmail" }
            },
            {
              operateOn: { component: "context", select: "ownerId" },
              writeTo: {
                condition: isEqual("ownerId", null),
                path: "attributes.ownerEmail"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "relationships.owner.data.id", name: "ownerId" },
          condition: mappingExists("incoming_account_attributes", { service: "owner" }),
          writeTo: { path: "attributes.owner" }
        },
        {
          strategy: "PropertyKeyedValue",
          arrayStrategy: "append_index",
          transforms: [
            { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
            {
              inputPath: "id", outputPath: "attributes.outreach/id",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              inputPath: "attributes.name",
              outputPath: "attributes.name",
              outputFormat: {
                value: "${value}",
                operation: "setIfNull"
              }
            },
            {
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              allowNull: true,
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.account_claims",
              inputPath: "attributes.${service_field_name}",
              outputPath: "ident.${hull_field_name}",
            }
          ]
        },
      ]
    },
    {
      input: WebPayload,
      output: HullIncomingAccount,
      direction: "incoming",
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "data.relationships.owner.id", name: "ownerId" },
          condition: mappingExists("incoming_account_attributes", { service: "ownerEmail" }),
          then: [
            {
              operateOn: { component: "glue", route: "getOwnerIdToEmailMap", select: "${ownerId}" },
              writeTo: { path: "data.attributes.ownerEmail" }
            },
            {
              writeTo: {
                condition: isEqual("ownerId", null),
                path: "data.attributes.ownerEmail"
              }
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "cloneInitialInput" },
          operateOn: { component: "input", select: "data.relationships.owner.id", name: "ownerId" },
          condition: mappingExists("incoming_account_attributes", { service: "owner" }),
          writeTo: { path: "data.attributes.owner" }
        },
        {
          strategy: "PropertyKeyedValue",
          arrayStrategy: "append_index",
          transforms: [
            { inputPath: "data.id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
            {
              inputPath: "data.id", outputPath: "attributes.outreach/id",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              inputPath: "data.attributes.name",
              outputPath: "attributes.name",
              outputFormat: {
                value: "${value}",
                operation: "setIfNull"
              }
            },
            {
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.account_claims",
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "ident.${hull_field_name}",
            }
          ]
        }
      ]
    },
    {
      input: OutreachEventRead,
      output: ServiceUserRaw,
      strategy: "MixedTransforms",
      transforms: [
        {
          strategy: "AtomicReaction",
          target: { component: "input", name: "eventInput" },
          validation:
            {
              error: "BreakProcess",
              message: "Event has never been seen before by the connector, please report issue to your Hull Support representative",
              condition:
                doesNotContain(require("./events.json"), "eventInput.attributes.name")
            }
        },
        {
          strategy: "AtomicReaction",
          target: { component: "input", name: "eventInput" },
          validation:
            {
              error: "BreakToLoop",
              message: "Event has not been whitelisted by the connector settings, please see the \"Events To Fetch\" in the settings to add this event type",
              condition:
                not(resolveIndexOf("connector.private_settings.events_to_fetch", "eventInput.attributes.name"))
            }
        },
        {
          strategy: "Jsonata",
          direction: "incoming",
          transforms: [
            {
              expression:
                "{\n" +
                "\t\"id\": relationships.prospect.data.id,\n" +
                "\t\"hull_events\": [\n" +
                "\t\t{\n" +
                "\t\t\t\"eventName\": attributes.name,\n" +
                "\t\t\t\"properties\": {\n" +
                "            \t\"body\": attributes.body,\n" +
                "                \"created_at\": attributes.createdAt,\n" +
                "                \"external_url\": attributes.externalUrl,\n" +
                "                \"email_id\": attributes.mailingId,\n" +
                "                \"payload\": attributes.payload,\n" +
                "                \"request_city\": attributes.requestCity,\n" +
                "                \"user_agent\": attributes.requestDevice,\n" +
                "                \"ip\": attributes.requestHost,\n" +
                "                \"request_proxied\": attributes.requestProxied,\n" +
                "                \"request_region\": attributes.requestRegion\n" +
                "            },\n" +
                "\t\t\t\"context\": {\n" +
                "\t\t\t\t\"event_id\": id,\n" +
                "\t\t\t\t\"created_at\": attributes.eventAt\n" +
                "\t\t\t}\n" +
                "\t\t}\n" +
                "\t]\n" +
                "}"
            }
          ]
        },
        {
          strategy: "AtomicReaction",
          target: { component: "input", name: "eventInput" },
          then: [
            {
              //target: { component: "input", select: "hullEvents[0]"},
              condition: notNull("eventInput.hull_events[0].properties.email_id"),
              operateOn: { component: "input", name: "mailingId", select: "hull_events[0].properties.email_id" },
              then: [
                {
                  operateOn: { component: "glue", route: "getMailingDetails", name: "enrichedEmail" },
                  // writeTo: { path: "hull_events[0].properties.email_subject", format: "${enrichedEmail.email_subject}" },
                  then: [
                    {
                      writeTo: { path: "hull_events[0].properties.email_subject", format: "${enrichedEmail.email_subject}" }
                    },
                    {
                      writeTo: { path: "hull_events[0].properties.sequence_id", format: "${enrichedEmail.sequence_id}" },
                    },
                    {
                      // condition: notNull("${enrichedEmail.sequence_id}"),
                      operateOn: { component: "glue", route: "getSequences", select: "${enrichedEmail.sequence_id}" },
                      writeTo: { path: "hull_events[0].properties.sequence_name" }
                    },
                  ]
                },
              ]
            },
            {
              operateOn: {
                component: "static",
                object: {
                  "bounced_message": "Bounced Message",
                  "emails_opt_out": "Emails Opt Out",
                  "inbound_message": "Inbound Message",
                  "message_clicked": "Message Clicked",
                  "message_opened": "Message Opened",
                  "message_opened_sender": "Message Opened Sender",
                  "outbound_message": "Outbound Message"
                },
                select: "${eventInput.hull_events[0].eventName}",
                name: "eventName"
              },
              then: [
                {
                  validation: { error: "BreakToLoop", condition: [
                      isNull("eventName"),
                    ]},
                }
              ],
              writeTo: {
                path: "hull_events[0].eventName"
              }
            }
          ]
        },
      ]
    }
  ];

module.exports = transformsToHull;
