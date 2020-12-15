/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import { createEnumTransformWithAttributeListOutgoing } from "hull-connector-framework/src/purplefusion/transform-predefined";
import { varInArray } from "hull-connector-framework/src/purplefusion/conditionals";

const {
  createLeadTransformation
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

const enumValueFields = ["Dropdown"];
const arrayEnumValueFields = ["MultiSelect"];

const customFieldsTransform = attributeList => {
  return {
    operateOn: { component: "settings", select: attributeList },
    expand: { valueName: "outgoingField" },
    then: {
      operateOn: {
        component: "glue",
        route: "getCustomFieldMapByName",
        select: "${outgoingField.service}",
        name: "customField"
      },
      then: [
        {
          condition: [
            not(varInArray("customField.type", enumValueFields)),
            not(varInArray("customField.type", arrayEnumValueFields)),
            not(varUndefined("customField.id"))
          ],
          operateOn: {
            component: "input",
            select: "attributes.${outgoingField.service}"
          },
          writeTo: {
            path: "custom_fields",
            appendToArray: true,
            format: {
              custom_field_definition_id: "${customField.id}",
              value: "${operateOn}"
            }
          }
        }
      ]
    }
  };
};

const addressTransform = [
  {
    operateOn: { component: "input", select: "addressStreet" },
    writeTo: "address.street"
  },
  {
    operateOn: { component: "input", select: "addressCity" },
    writeTo: "address.city"
  },
  {
    operateOn: { component: "input", select: "addressState" },
    writeTo: "address.state"
  },
  {
    operateOn: { component: "input", select: "addressPostalCode" },
    writeTo: "address.postalCode"
  },
  {
    operateOn: { component: "input", select: "addressCountry" },
    writeTo: "address.country"
  }
];

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
      },
      createEnumTransformWithAttributeListOutgoing({
        attribute: "assigneeEmail",
        writePath: "assignee_id",
        attributeList: "outgoing_lead_attributes",
        route: "getAssigneeId",
        forceRoute: "forceGetAssigneeId",
        formatOnNull: null
      }))
  },
  {
    input: HullLeadRaw,
    output: CopperCRMOutgoingExistingLead,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      createLeadTransformation(""),
      createEnumTransformWithAttributeListOutgoing({
        attribute: "assigneeEmail",
        writePath: "assignee_id",
        attributeList: "outgoing_lead_attributes",
        route: "getAssigneeId",
        forceRoute: "forceGetAssigneeId",
        formatOnNull: null
      })
    )
  },
  {
    input: HullUserRaw2,
    output: CopperCRMOutgoingPerson,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      addressTransform,
      {
        operateOn: { component: "input", select: "attributes.primaryEmail" },
        writeTo: {
          path: "emails",
          format: [
            {
              email: "${operateOn.value}",
              category: "other"
            }
          ]
        }
      },
      {
        operateOn: { component: "input", select: "hull_service_accountId" },
        writeTo: "company_id"
      },
      {
        // this sends all of the default values that can be taken as is
        operateOn: {
          component: "static",
          object: require("./fields/people_fields"),
          select: { readOnly: false, needsTranslation: false }
        },
        expand: { valueName: "personField" },
        then: {
          operateOn: {
            component: "input",
            select: "attributes.${personField.name}"
          },
          writeTo: { path: "${personField.name}" }
        }
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
      },
      customFieldsTransform("outgoing_user_attributes")
    )
  }
];

module.exports = transformsToHull;
