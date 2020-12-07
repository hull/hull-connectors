/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  createLeadTransformation
} = require("./transforms-to-service-utils");
const _ = require("lodash");

const {
  HullLeadRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead
} = require("./service-objects");

const {
  varEqual,
}  = require("hull-connector-framework/src/purplefusion/conditionals");



const transformsToHull: ServiceTransforms = [
  {
    input: HullLeadRaw,
    output: CopperCRMOutgoingLead,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then:_.concat(
      createLeadTransformation("properties."),
      {
        operateOn: { component: "input", select: "ident[0]" },
        // For now only support resolution on email
        condition: varEqual("operateOn.service", "primaryEmail"),
        writeTo: {
          path: "match",
          format: {
            field_name: "email",
            field_value: "${operateOn.value}"
          }
        }
      })
  },
  {
    input: HullLeadRaw,
    output: CopperCRMOutgoingExistingLead,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: createLeadTransformation("")
  }
];

module.exports = transformsToHull;
