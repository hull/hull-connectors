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
  HullIncomingAccount,
  HullConnectorAttributeDefinition,
  WebPayload
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  PipedrivePersonRead,
  PipedriveOrgRead,
  PipedriveAttributeDefinition
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: PipedriveAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      `$map(
        $filter(data, function($v, $i, $a) {
          $v.bulk_edit_allowed = true
        }), function($v, $i, $a) {
          {"type": $v.field_type, 
          "name": $v.key, 
          "display": $v.name, 
          "readOnly": $not($v.bulk_edit_allowed)}
        })`
    ]
  },
  {
    input: PipedrivePersonRead,
    output: ServiceUserRaw,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      { inputPath: "id", outputPath: "ident.anonymous_id", outputFormat: "pipedrive:${value}" },
      {
        arrayStrategy: "pick_first",
        condition: doesContain(["email"], "service_field_name"),
        mapping: "connector.private_settings.user_claims",
        inputPath: "${service_field_name}",
        outputPath: "ident.${hull_field_name}",
      },
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
    input: WebPayload,
    output: ServiceUserRaw,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input", path: "current" },
        inputPath: "current.${service_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        mapping: { type: "input", path: "current" },
        arrayStrategy: "pick_first",
        condition: doesContain(["email", "phone"], "service_field_name"),
        inputPath: "current.${service_field_name}",
        outputPath: "${service_field_name}",
        outputFormat: "${value.value}"
      },
      {
        inputPath: "current.org_id",
        outputPath: "hull_service_accountId",
        outputFormat: "${value.value}"
      },
      {
        condition: "createdByWebhook",
        outputPath: "attributes.pipedrive/created_by_webhook",
        outputFormat: {
          value: "${createdByWebhook}",
          operation: "set"
        }
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
      { inputPath: "id",
        outputPath: "attributes.pipedrive/id",
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
        inputPath: "${service_field_name}",
        outputPath: "ident.${hull_field_name}",
      },
    ]
  },
  {
    input: WebPayload,
    output: HullIncomingAccount,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      { inputPath: "current.id", outputPath: "ident.anonymous_id", outputFormat: "pipedrive:${value}" },
      { inputPath: "current.id", outputPath: "attributes.pipedrive/id",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      },
      {
        mapping: "connector.private_settings.incoming_account_attributes",
        inputPath: "current.${service_field_name}",
        outputPath: "attributes.${hull_field_name}",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      }
    ]
  }
];

module.exports = transformsToHull;
