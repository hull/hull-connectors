/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  isEqual,
  doesContain,
  isNotEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullIncomingUser,
  HullIncomingAccount,
  WebPayload
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  PipedrivePersonRead,
  PipedriveOrgRead
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: PipedrivePersonRead,
    output: HullIncomingUser,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        inputPath: "id",
        outputPath: "ident.anonymous_id",
        outputFormat: "pipedrive:${value}"
      },
      {
        inputPath: "id",
        outputPath: "attributes.pipedrive/id",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      },
      // {
      //   condition: "connector.private_settings.link_users_in_hull",
      //   inputPath: "relationships.account.data.id",
      //   outputPath: "accountIdent.anonymous_id",
      //   outputFormat: "pipedrive:${value}"
      // },
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
        outputPath: "ident.${hull_field_name}"
      }
    ]
  }
];

module.exports = transformsToHull;
