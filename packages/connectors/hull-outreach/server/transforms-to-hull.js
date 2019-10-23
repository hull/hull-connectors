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
          operateOn: { type: "input", path: "relationships.stage.data.id" },
          condition: mappingExists("incoming_user_attributes", { service: "stageName" }),
          mapOn: {
            key: { type: "input", path: "relationships.stage.data.id" },
            map: { type: "glue", route: "getStageIdMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "attributes.stageName" }
        },
        {
          strategy: "AtomicReaction",
          operateOn: { type: "input", path: "relationships.owner.data.id" },
          condition: mappingExists("incoming_user_attributes", { service: "ownerEmail" }),
          mapOn: {
            key: { type: "input", path: "relationships.owner.data.id" },
            map: { type: "glue", route: "getOwnerIdToEmailMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "attributes.ownerEmail" }
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
              condition: doesNotContain(["stage", "owner"], "service_field_name"),
              inputPath: "attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.incoming_user_attributes",
              condition: doesContain(["stage", "owner"], "service_field_name"),
              inputPath: "relationships.${service_field_name}.data.id",
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
          operateOn: { type: "input", path: "data.relationships.stage.id" },
          condition: mappingExists("incoming_user_attributes", { service: "stageName" }),
          mapOn: {
            key: { type: "input", path: "data.relationships.stage.id" },
            map: { type: "glue", route: "getStageIdMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "data.attributes.stageName" }
        },
        {
          strategy: "AtomicReaction",
          operateOn: { type: "input", path: "data.relationships.owner.id" },
          condition: mappingExists("incoming_user_attributes", { service: "ownerEmail" }),
          mapOn: {
            key: { type: "input", path: "data.relationships.owner.id" },
            map: { type: "glue", route: "getOwnerIdToEmailMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "data.attributes.ownerEmail" }
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
              condition: doesNotContain(["stage", "owner"], "service_field_name"),
              inputPath: "data.attributes.${service_field_name}",
              outputPath: "attributes.${hull_field_name}",
              outputFormat: {
                value: "${value}",
                operation: "set"
              }
            },
            {
              mapping: "connector.private_settings.incoming_user_attributes",
              condition: [doesContain(["stage", "owner"], "service_field_name"), isNotEqual("value", 0)],
              inputPath: "data.relationships.${service_field_name}.id",
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
          operateOn: { type: "input", path: "relationships.owner.data.id" },
          condition: mappingExists("incoming_account_attributes", { service: "ownerEmail" }),
          mapOn: {
            key: { type: "input", path: "data.relationships.owner.id" },
            map: { type: "glue", route: "getOwnerIdToEmailMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "attributes.ownerEmail" }
        },
        {
          strategy: "AtomicReaction",
          operateOn: { type: "input", path: "relationships.owner.data.id" },
          condition: mappingExists("incoming_account_attributes", { service: "owner" }),
          target: { type: "cloneInitialInput" },
          output: { path: "attributes.owner" }
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
          operateOn: { type: "input", path: "data.relationships.owner.id" },
          condition: mappingExists("incoming_account_attributes", { service: "ownerEmail" }),
          mapOn: {
            key: { type: "input", path: "data.relationships.owner.id" },
            map: { type: "glue", route: "getOwnerIdToEmailMap" }
          },
          target: { type: "cloneInitialInput" },
          output: { path: "data.attributes.ownerEmail" }
        },
        {
          strategy: "AtomicReaction",
          operateOn: { type: "input", path: "data.relationships.owner.id" },
          condition: mappingExists("incoming_account_attributes", { service: "owner" }),
          target: { type: "cloneInitialInput" },
          output: { path: "data.attributes.owner" }
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
