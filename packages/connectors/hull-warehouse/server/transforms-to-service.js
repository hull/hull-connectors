import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";


const {
  HullApiAttributeDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  PostgresUserSchema,
  PostgresAccountSchema
} = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullApiAttributeDefinition,
    output: PostgresUserSchema,
    strategy: "MixedTransforms",
    direction: "outgoing",
    transforms: [
      {
        strategy: "AtomicReaction",
        target: { component: "new" },
        then: [
          {
            operateOn: { component: "settings", select: "outgoing_user_attributes" },
            expand: { valueName: "mapping" },
            then: [
              {
                operateOn: { component: "input", select: [{ name: "${mapping.hull}" }, "[0]"], name: "outgoing" },
                writeTo: { path: "arrayOfAttributes", appendToArray: true, format: { name: "${mapping.service}", type: "${outgoing.type}" } }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    input: HullApiAttributeDefinition,
    output: PostgresAccountSchema,
    strategy: "MixedTransforms",
    direction: "outgoing",
    transforms: [
      {
        strategy: "AtomicReaction",
        target: { component: "new" },
        then: [
          {
            operateOn: { component: "settings", select: "outgoing_user_attributes" },
            expand: { valueName: "mapping" },
            then: [
              {
                operateOn: { component: "input", select: [{ name: "${mapping.hull}" }, "[0]"], name: "outgoing" },
                writeTo: { path: "arrayOfAttributes", appendToArray: true, format: { name: "${mapping.service}", type: "${outgoing.type}" } }
              }
            ]
          }
        ]
      }
    ]
  }
];

module.exports = transformsToService;
