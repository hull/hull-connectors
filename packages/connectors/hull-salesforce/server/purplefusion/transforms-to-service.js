/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
const { HullOutgoingEvent } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { TaskWrite } = require("./service-objects");
const { toISOString } = require("hull-connector-framework/src/purplefusion/transform-utils");


const {
  doesNotContain,
  isEqual,
  isNotEqual,
  mappingExists,
  notNull,
  isNull,
  doesContain,
  varEqual,
  not
} = require("hull-connector-framework/src/purplefusion/conditionals");


const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingEvent,
    output: TaskWrite,
    strategy: "PropertyKeyedValue",
    direction: "outgoing",
    arrayStrategy: "send_raw_array",
    transforms: [
      {
        mapping: "connector.private_settings.task_references_outbound",
        inputPath: "user.${hull_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        mapping: "connector.private_settings.task_attributes_outbound",
        condition: isNotEqual("hull_field_name", "created_at"),
        inputPath: "event.${hull_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        mapping: "connector.private_settings.task_attributes_outbound",
        condition: isEqual("hull_field_name", "created_at"),
        inputPath: "event.${hull_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        outputPath: "Type",
        outputFormat: "${taskType}"
      },
      {
        mapping: "connector.private_settings.salesforce_external_id",
        inputPath: "event.event_id",
        outputPath: "${connector.private_settings.salesforce_external_id}",
      }
    ],
    preAttributeTransform: [
      {
        attributes: [
          "event.created_at",
        ],
        transform: toISOString()
      }
    ]
  }
];

module.exports = transformsToService;
