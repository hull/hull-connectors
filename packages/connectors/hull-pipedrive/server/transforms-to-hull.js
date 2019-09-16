/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  isEqual,
  doesContain,
  isNotEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  ServiceUserRaw,
  HullIncomingAccount
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
    output: ServiceUserRaw,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input" },
        inputPath: "${service_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "pick_first",
        condition: doesContain(["email", "phone"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "${service_field_name}",
        outputFormat: "${value.value}"
      },
      {
        inputPath: "org_id",
        outputPath: "hull_service_accountId",
        outputFormat: "${value.value}"
      }
    ]
  },
  {
    input: PipedriveOrgRead,
    output: HullIncomingAccount,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "pipedrive:${value}" },
      { inputPath: "id", outputPath: "attributes.pipedrive/id",
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
      {
        mapping: "connector.private_settings.account_claims",
        condition: doesNotContain(["owner_id"], "service_field_name"),
        inputPath: "attributes.${service_field_name}",
        outputPath: "ident.${hull_field_name}",
      }
    ]
  }
];

module.exports = transformsToHull;
