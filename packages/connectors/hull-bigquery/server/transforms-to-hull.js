/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { BigqueryUserRead, BigqueryAccountRead } = require("./service-objects");
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
        condition: doesNotContain(["email", "external_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "attributes.${service_field_name}",
      },
      {
        mapping: { type: "input" },
        arrayStrategy: "append_index",
        condition: doesContain(["email", "external_id"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "ident.${service_field_name}",
      }
    ]
  },
  {
    input: BigqueryAccountRead,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "MixedTransforms",
  }
];

module.exports = transformsToHull;
