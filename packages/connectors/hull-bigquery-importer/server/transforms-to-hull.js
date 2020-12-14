/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { BigqueryUserRead, BigqueryAccountRead, BigqueryEventRead } = require("./service-objects");
const { HullIncomingUser, HullIncomingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  doesNotContain,
  doesContain,
  isEqual,
  mappingExists,
  notNull,
  isNull,
  not,
  resolveIndexOf,
  inputIsEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const transformsToHull: ServiceTransforms = [
  {
    input: BigqueryUserRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "PropertyKeyedValue",
    transforms: [
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesNotContain(["email", "external_id", "anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "attributes.${attributesGroupName}/${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["email", "external_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
        outputFormat: "bigquery:${value}"
      }
    ]
  },
  {
    input: BigqueryAccountRead,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "PropertyKeyedValue",
    transforms: [
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesNotContain(["domain", "external_id", "anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "attributes.${attributesGroupName}/${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["domain", "external_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
        outputFormat: "bigquery:${value}"
      }
    ]
  },
  {
    input: BigqueryEventRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "PropertyKeyedValue",
    transforms: [
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesNotContain(["domain", "external_id", "created_at", "event_id", "event_name", "email", "anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "events[0].properties.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["email", "external_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["anonymous_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
        outputFormat: "bigquery:${value}"
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["created_at", "event_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "events[0].context.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["event_name"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "events[0].eventName",
      }
    ]
  },
];

module.exports = transformsToHull;
