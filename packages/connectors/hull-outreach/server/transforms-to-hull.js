/* @flow */
import type { ServiceTransforms } from "./shared/types";

const {
  HullIncomingUser,
  HullIncomingAccount
} = require("./shared/hull-service-objects");

const {
  OutreachProspectRead,
  OutreachAccountRead
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
      transforms: [
        { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "outreach:${value}" },
        { inputPath: "attributes.emails[0]", outputPath: "ident.email" },
        { mapping: "connector.private_settings.prospect_attributes_inbound",
          inputPath: "attributes/${input_field_name}",
          outputPath: "attributes.outreach/${output_field_name}",
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
      transforms: [
        { inputPath: "id", outputPath: "ident.anonymous_id" },
        { inputPath: "attributes.domain", outputPath: "ident.domain" },
        { mapping: "connector.private_settings.account_attributes_inbound",
          inputPath: "attributes/${input_field_name}",
          outputPath: "attributes.outreach/${output_field_name}",
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
