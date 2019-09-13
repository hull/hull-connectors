/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  isEqual,
  doesContain,
  isNotEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  ServiceUserRaw
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
        outputPath: "${hull_field_name}"
      },
      {
        mapping: { type: "input" },
        condition: doesContain(["email", "phone"], "service_field_name"),
        outputPath: "${service_field_name}",
        outputFormat: "${hull_field_name}"
      },
      {
        inputPath: "org_id",
        outputPath: "hull_service_accountId",
        outputFormat: "${hull_field_name}"
      }
    ]
  }
];

module.exports = transformsToHull;
