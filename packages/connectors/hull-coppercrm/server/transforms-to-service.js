/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import { createEnumTransformWithAttributeListOutgoing } from "hull-connector-framework/src/purplefusion/transform-predefined";
import { varInArray } from "hull-connector-framework/src/purplefusion/conditionals";

const {
  createLeadTransformation,
  createPersonTransformation
} = require("./transforms-to-service-utils");
const _ = require("lodash");

const {
  HullLeadRaw,
  HullUserRaw2,
  HullOutgoingEvent
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead,
  CopperCRMOutgoingPerson,
  CopperCRMOutgoingActivity
} = require("./service-objects");

const {
  varUndefined,
  varUndefinedOrNull,
  varEqual,
  not,
  isCustomVarAttributeInVarList
}  = require("hull-connector-framework/src/purplefusion/conditionals");

const transformsToHull: ServiceTransforms = [
  {
    input: HullOutgoingEvent,
    output: CopperCRMOutgoingActivity,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "event", name: "eventName" },
        validation: {
          condition: not(isCustomVarAttributeInVarList("event", "eventName", "events_mapping")),
          error: "BreakToLoop",
          message: "Event not whitelisted"
        },
        then: [
          {
            operateOn: {
              component: "settings",
              select: ["events_mapping", { event: "${eventName}" }, "[0]"],
              name: "eventMapping" },
            then: [
              {
                operateOn: { component: "input", select: "${eventMapping.operation}", name: "operation" },
                validation: {
                  condition: varUndefinedOrNull("operation"),
                  error: "BreakToLoop",
                  message: "Invalid \"details\" attribute mapping inside events mapping"
                  // Maybe display the said event name to simplify debugging
                }
              },
              {
                operateOn: { component: "context", select: "parent" },
                writeTo: "parent"
              },
              {
                writeTo: {
                  path: "type",
                  format: {
                    category: "user",
                    id: "${eventMapping.activity_type}"
                  }
                }
              },
              {
                operateOn: { component: "input", select: "${event.created_at}" },
                writeTo: "activity_date"
              },
              {
                operateOn: { component: "input", select: "${eventMapping.operation}" },
                condition: not(varUndefinedOrNull("eventMapping.operation")),
                writeTo: "details"
              },
              {
                operateOn: { component: "input", select: "properties.copper_activity_id" },
                condition: not(varUndefinedOrNull("properties.copper_activity_id")),
                writeTo: "id"
              }
            ]
          }
        ]
      }
    ]
  },
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
  },
  {
    input: HullUserRaw2,
    output: CopperCRMOutgoingPerson,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: createPersonTransformation()
  }
];

module.exports = transformsToHull;
