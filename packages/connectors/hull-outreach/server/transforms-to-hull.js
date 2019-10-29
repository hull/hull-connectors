/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { doesNotContain, isEqual, doesContain, isNotEqual, isServiceAttribute, mappingExists } = require("hull-connector-framework/src/purplefusion/conditionals");


const {
  HullIncomingUser,
  HullIncomingAccount,
  WebPayload,
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  OutreachProspectRead,
  OutreachAccountRead,
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
              writeTo: { path: "data.attributes.stageName" }
            },
            {
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
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              allowNull: true,
              condition: doesNotContain(["name"], "hull_field_name"),
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              condition: doesContain(["name"], "hull_field_name"),
              outputFormat: {
                value: "${value}",
                operation: "setIfNull"
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
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              condition: doesNotContain(["name"], "hull_field_name"),
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.incoming_account_attributes",
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              condition: doesContain(["name"], "hull_field_name"),
              outputFormat: {
                value: "${value}",
                operation: "setIfNull"
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
    }

  ];

module.exports = transformsToHull;
