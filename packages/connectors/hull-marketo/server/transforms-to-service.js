/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  inputIsEqual,
  isEqual,
  doesContain,
  inputIsNotEqual,
  isNotEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  MarketoLeadAttributeDefinition,
  MarketoOutgoingLead
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: HullUserRaw,
    output: MarketoOutgoingLead,
    strategy: "Jsonata",
    direction: "outgoing",
    batchTransform: true,
    transforms: [
      "{\n" +
      "  \"action\": \"createOrUpdate\",\n" +
      "  \"asyncProcessing\": true,\n" +
      "  \"lookupField\": $user_claim.service,\n" +
      "  \"input\": [$]\n" +
      "}"
    ]
  }
];

module.exports = transformsToHull;
