/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  inputIsEqual,
  inputIsNotEqual,
  isNotEqual,
  isEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullConnectorAttributeDefinition,
  HullConnectorEnumDefinition,
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  MarketoLeadAttributeDefinition,
  MarketoIncomingStreamLead,
  MarketoIncomingLeadActivity,
  MarketoActivityTypeIdMap
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: MarketoLeadAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      `$.{"type": dataType, "name": rest.name, "display": displayName, "readOnly": rest.readOnly}`
    ]
  },
  {
    input: MarketoActivityTypeIdMap,
    output: HullConnectorEnumDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      "${ $string(id): name }"
    ]
  },
  {
    input: MarketoIncomingLeadActivity,
    output: ServiceUserRaw,
    strategy: "Jsonata",
    direction: "incoming",
    transforms: [
      {
        condition: inputIsEqual("activityTypeId", 13),
        expression: "$merge([{ \"id\": $.leadId }, $.fields{ name: newValue }])"
      },
      {
        condition: inputIsNotEqual("activityTypeId", 13),
        expression:
          "$.(\n" +
          "{\n" +
          "\t\"id\": leadId,\n" +
          "\t\"hull_events\": [\n" +
          "      {\n" +
          "    \t\"eventName\": $lookup($activityTypeIdMap, $string(activityTypeId)),\n" +
          "    \t\"properties\": $merge(attributes.{ name: value }),\n" +
          "        \"context\": { \"event_id\": id, \"created_at\": activityDate }\n" +
          "      }\n" +
          "    ]\n" +
          "}\n" +
          ")"
      }
    ]
  },
  {
    input: MarketoIncomingStreamLead,
    output: ServiceUserRaw,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input" },
        condition: isNotEqual("value", "null"),
        inputPath: "${service_field_name}",
        outputPath: "${hull_field_name}"
      }
    ]
  },
];

module.exports = transformsToHull;
