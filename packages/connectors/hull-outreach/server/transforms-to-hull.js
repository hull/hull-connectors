/* @flow */
import type { ServiceTransforms } from "./shared/types";

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
        { inputPath: "id", outputPath: "attributes.outreach/id",
          outputFormat: {
            value: "${value}",
            operation: "set"
            }
        },
        { inputPath: "attributes.emails[0]", outputPath: "ident.email" },
        { mapping: "connector.private_settings.incoming_user_attributes",
          inputPath: "attributes.${service_field_name}",
          outputPath: "attributes.${hull_field_name}",
          outputFormat: {
            value: "${value}",
            operation: "set"
          }
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
        { inputPath: "data.attributes.emails[0]", outputPath: "ident.email" },
        { mapping: "connector.private_settings.incoming_user_attributes",
          inputPath: "data.attributes.${service_field_name}",
          outputPath: "attributes.${hull_field_name}",
          outputFormat: {
            value: "${value}",
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
        { inputPath: "attributes.domain", outputPath: "ident.domain" },
        { mapping: "connector.private_settings.incoming_account_attributes",
          inputPath: "attributes.${service_field_name}",
          outputPath: "attributes.${hull_field_name}",
          outputFormat: {
            value: "${value}",
            operation: "set"
          }
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
        { inputPath: "data.id", outputPath: "attributes.outreach/id" },
        { inputPath: "data.attributes.domain", outputPath: "ident.domain",
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
        }
      ]
    }

  ];

module.exports = {
  transformsToHull
};
