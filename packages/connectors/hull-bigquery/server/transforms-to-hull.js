/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { HullEnumMap } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { BigqueryProjectsMap } = require("./service-objects");

const transformsToHull: ServiceTransforms = [
  {
    input: BigqueryProjectsMap,
    output: HullEnumMap,
    strategy: "AtomicReaction",
    transforms: [
      {
        strategy: "Jsonata",
        direction: "incoming",
        transforms: [
          {
            expression: "projects.[{\"value\": id, \"label\":friendlyName}]"
          }
        ]
      }
    ]
  }
];

module.exports = transformsToHull;
