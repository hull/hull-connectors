/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  HullLeadRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead
} = require("./service-objects");

const {
  varUndefined,
  not
}  = require("hull-connector-framework/src/purplefusion/conditionals");

const transformsToHull: ServiceTransforms = [
  {
    input: HullLeadRaw,
    output: CopperCRMOutgoingLead,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "attributes" },
        expand: { keyName: "key", valueName: "value" },
        then: {
          writeTo: { path: "properties.${key}" }
        }
      },
      {
        operateOn: { component: "input", select: "attributes.email", name: "email" },
        condition: not(varUndefined("email")),
        writeTo: {
          path: "properties.${key}",
          format: {
            email: "${email}",
            category: "other"
          }
        }
      },
      {
        operateOn: { component: "input", select: "ident[0]" },
        writeTo: {
          path: "match",
          format: {
            field_name: "${operateOn.service}",
            field_value: "${operateOn.value}"
          }
        }
      }
    ]
  },
  {
    input: HullLeadRaw,
    output: CopperCRMOutgoingExistingLead,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "attributes" },
        expand: { keyName: "key", valueName: "value" },
        then: {
          writeTo: { path: "properties.${key}" }
        }
      }
    ]
  }
];

module.exports = transformsToHull;
