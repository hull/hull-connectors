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
  varEqual,
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
        then: [
          {
            condition: not(varEqual("key", "primaryEmail")),
            writeTo: { path: "properties.${key}" }
          },
          {
            condition: varEqual("key", "primaryEmail"),
            writeTo: {
              path: "properties.email",
              format: {
                email: "${value}",
                category: "other"
              }
            }
          }
        ]
      },
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
        then: [
          {
            condition: not(varEqual("key", "primaryEmail")),
            writeTo: { path: "properties.${key}" }
          },
          {
            condition: varEqual("key", "primaryEmail"),
            writeTo: {
              path: "properties.email",
              format: {
                email: "${value}",
                category: "other"
              }
            }
          }
        ]
      },
    ]
  }
];

module.exports = transformsToHull;
