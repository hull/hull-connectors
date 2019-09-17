import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  isNotEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  PipedrivePersonWrite
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: HullUserRaw,
    output: PipedrivePersonWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input" },
        condition: doesNotContain(["hull_service_accountId"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        inputPath: "hull_service_accountId",
        outputPath: "org_id"
      },
      {
        inputPath: "${accountId}",
        outputPath: "org_id"
      }
    ]
  }
];

module.exports = transformsToHull;
