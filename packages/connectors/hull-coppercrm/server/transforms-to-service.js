/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import { createEnumTransformWithAttributeListOutgoing } from "hull-connector-framework/src/purplefusion/transform-predefined";

const {
  HullLeadRaw,
  HullUserRaw2
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead,
  CopperCRMOutgoingPerson
} = require("./service-objects");

const {
  varEqual,
  not
} = require("hull-connector-framework/src/purplefusion/conditionals");

const transformsToHull: ServiceTransforms = [
  {
    input: HullUserRaw2,
    output: CopperCRMOutgoingPerson,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "attributes" },
        expand: { keyName: "key", valueName: "value" },
        then: [
          {
            condition: not(varEqual("key", "primaryEmail")),
            writeTo: { path: "${key}" }
          },
          {
            condition: varEqual("key", "primaryEmail"),
            writeTo: {
              path: "emails[0]",
              format: {
                email: "${value}",
                category: "other"
              }
            }
          }
        ]
      },
      createEnumTransformWithAttributeListOutgoing({
        attribute: "assigneeEmail",
        writePath: "assignee_id",
        attributeList: "outgoing_user_attributes",
        route: "getAssigneeIds",
        forceRoute: "forceGetAssigneeIds",
        formatOnNull: null
      }),
      {
        operateOn: { component: "input", select: "ident[0]" },
        // For now only support resolution on email
        condition: varEqual("operateOn.service", "primaryEmail"),
        writeTo: {
          path: "emails[0]",
          format: {
            email: "${operateOn.value}",
            category: "other"
          }
        }
      }
    ]
  },
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
      createEnumTransformWithAttributeListOutgoing({
        attribute: "assigneeEmail",
        writePath: "assignee_id",
        attributeList: "outgoing_lead_attributes",
        route: "getAssigneeIds",
        forceRoute: "forceGetAssigneeIds",
        formatOnNull: null
      }),
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
      }
    ]
  }
];

module.exports = transformsToHull;
