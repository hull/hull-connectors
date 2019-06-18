/* @flow */
import type { ServiceTransforms } from "./shared/types";

const { doesNotContain, isEqual, doesContain, isNotEqual } = require("./shared/conditionals");


const {
  HullIncomingUser,
  HullIncomingAccount
} = require("./shared/hull-service-objects");

const {
  OutreachProspectRead,
  OutreachAccountRead,
  WebhookPayload,
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
      strategy: "PropertyKeyedValue",
      arrayStrategy: "append_index",
      direction: "incoming",
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
    },
    {
      input: WebhookPayload,
      output: HullIncomingUser,
      strategy: "PropertyKeyedValue",
      arrayStrategy: "append_index",
      direction: "incoming",
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
    },
    {
      input: OutreachAccountRead,
      output: HullIncomingAccount,
      strategy: "PropertyKeyedValue",
      arrayStrategy: "append_index",
      direction: "incoming",
      transforms: [
        { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
        { inputPath: "id", outputPath: "attributes.outreach/id",
          outputFormat: {
            value: "${value}",
            operation: "set"
            }
        },
        { mapping: "connector.private_settings.incoming_account_attributes",
          inputPath: "attributes.${service_field_name}",
          outputPath: "attributes.${hull_field_name}",
          outputFormat: {
            value: "${value}",
            operation: "set"
          }
        },
        { mapping: "connector.private_settings.account_claims",
          inputPath: "attributes.${service_field_name}",
          outputPath: "ident.${hull_field_name}",
        }
      ]
    },
    {
      input: WebhookPayload,
      output: HullIncomingAccount,
      strategy: "PropertyKeyedValue",
      arrayStrategy: "append_index",
      direction: "incoming",
      transforms: [
        { inputPath: "data.id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
        { inputPath: "data.id", outputPath: "attributes.outreach/id",
          outputFormat: {
            value: "${value}",
            operation: "set"
            }
        },
        { mapping: "connector.private_settings.incoming_account_attributes",
          inputPath: "data.attributes.${service_field_name}",
          outputPath: "attributes.${hull_field_name}",
          outputFormat: {
            value: "${value}",
            operation: "set"
          }
        },
        { mapping: "connector.private_settings.account_claims",
          inputPath: "data.attributes.${service_field_name}",
          outputPath: "ident.${hull_field_name}",
        }
      ]
    }

  ];

module.exports = {
  transformsToHull
};