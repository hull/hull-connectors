import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  isNull,
  notNull,
  isEqual,
  varStartsWithString,
  not
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullApiAttributeDefinition,
  HullOutgoingAccount,
  HullOutgoingUser,
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  PostgresUserSchema,
  PostgresAccountSchema,
  WarehouseUserWrite,
  WarehouseAccountWrite
} = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullApiAttributeDefinition,
    output: PostgresUserSchema,
    strategy: "AtomicReaction",
    direction: "outgoing",
    batchTransform: true,
    target: { component: "input" },
    asPipeline: true,
    condition: isEqual("connector.private_settings.send_all_user_attributes", false),
    then: [
      {
        target: { component: "new" },
        operateOn: { component: "settings", select: "outgoing_user_attributes" },
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: { component: "input", select: [{ key: "${mapping.hull}" }, "[0]"], name: "outgoing" },
            then: [
              {
                condition: notNull("outgoing"),
                target: { component: "context", select: "outgoing" },
                writeTo: { path: "key", format: "${mapping.service}" },
              },
              {
                condition: notNull("outgoing"),
                writeTo: { path: "arrayOfAttributes", appendToArray: true, format: "${outgoing}" },
              },
              {
                condition: isNull("outgoing"),
                operateOn: { component: "input", select: [{ key: "traits_${mapping.hull}" }, "[0]"], name: "trait_outgoing" },
                then: [
                  {
                    target: { component: "context", select: "trait_outgoing" },
                    writeTo: { path: "key", format: "${mapping.service}" },
                  },
                  {
                    writeTo: { path: "arrayOfAttributes", appendToArray: true, format: "${trait_outgoing}" },
                  },
                ]
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
    strategy: "AtomicReaction",
    direction: "outgoing",
    target: { component: "input" },
    asPipeline: true,
    batchTransform: true,
    condition: isEqual("connector.private_settings.send_all_account_attributes", false),
    then: [
      {
        target: { component: "new" },
        operateOn: { component: "settings", select: "outgoing_account_attributes" },
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: { component: "input", select: [{ key: "${mapping.hull}" }, "[0]"], name: "outgoing" },
            then: [
              {
                condition: notNull("outgoing"),
                target: { component: "context", select: "outgoing" },
                writeTo: { path: "key", format: "${mapping.service}" },
              },
              {
                condition: notNull("outgoing"),
                writeTo: { path: "arrayOfAttributes", appendToArray: true, format: "${outgoing}" },
              },
              {
                condition: isNull("outgoing"),
                operateOn: { component: "input", select: [{ key: "traits_${mapping.hull}" }, "[0]"], name: "trait_outgoing" },
                then: [
                  {
                    target: { component: "context", select: "trait_outgoing" },
                    writeTo: { path: "key", format: "${mapping.service}" },
                  },
                  {
                    writeTo: { path: "arrayOfAttributes", appendToArray: true, format: "${trait_outgoing}" },
                  },
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    input: HullOutgoingUser,
    output: WarehouseUserWrite,
    strategy: "AtomicReaction",
    direction: "outgoing",
    target: { component: "input" },
    asPipeline: true,
    batchTransform: true,
    condition: isEqual("connector.private_settings.send_all_user_attributes", false),
    then: [
      {
        target: { component: "new" },
        then: [
          {
            operateOn: { component: "settings", select: "outgoing_user_attributes" },
            expand: { valueName: "mapping" },
            then: [
              {
                condition: not(varStartsWithString("mapping.hull", "account")),
                operateOn: { component: "input", select: "user.${mapping.hull}" },
                writeTo: { path: "user.${mapping.service}" },
              },
              {
                condition: varStartsWithString("mapping.hull", "account"),
                operateOn: { component: "input", select: "${mapping.hull}" },
                writeTo: { path: "account.${mapping.service}" },
              },
              {
                operateOn: { component: "input", select: "user.id" },
                writeTo: { path: "user.id" }
              },
              {
                operateOn: { component: "input", select: "account.id" },
                writeTo: { path: "account.id" }
              },
              {
                operateOn: { component: "input", select: "segments" },
                writeTo: { path: "segments" }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    input: HullOutgoingAccount,
    output: WarehouseAccountWrite,
    strategy: "AtomicReaction",
    direction: "outgoing",
    target: { component: "input" },
    asPipeline: true,
    batchTransform: true,
    condition: isEqual("connector.private_settings.send_all_account_attributes", false),
    then: [
      {
        target: { component: "new" },
        then: [
          {
            operateOn: { component: "settings", select: "outgoing_account_attributes" },
            expand: { valueName: "mapping" },
            then: [
              {
                operateOn: { component: "input", select: "account.${mapping.hull}" },
                writeTo: { path: "account.${mapping.service}" },
              },
              {
                operateOn: { component: "input", select: "account.id" },
                writeTo: { path: "account.id" }
              },
              {
                operateOn: { component: "input", select: "account_segments" },
                writeTo: { path: "account_segments" }
              }
            ]
          }
        ]
      }
    ]
  },
];

module.exports = transformsToService;
