/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
const _ = require("lodash");
const moment = require("moment");

const {
  HullIncomingUser,
  ServiceAccountRaw,
  ServiceOpportunityRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  createIncomingServiceUserTransform,
  createEnumTransformWithAttributeList,
  createEnumTransform
}  = require("hull-connector-framework/src/purplefusion/transform-predefined");

const {
  varNull,
  varInArray,
  varEqual,
  varEqualVar,
  not,
  isVarServiceAttributeInVarList,
  or
}  = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity,
  CopperCRMIncomingActivity
} = require("./service-objects");

const {
  isUndefinedOrNull
} = require("hull-connector-framework/src/purplefusion/utils");


const dateFormatter = (value) => {
  if (isUndefinedOrNull(value))
    return value;
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

// only date currently needing conversion is "closedate"
// if a dynamic set needs it in the future, can use this...
const convertDatesUsingSchema = (schemaRoute) => {
  return {
    target: { component: "input" },
    operateOn: { component: "glue", route: schemaRoute },
    expand: { valueName: "attribute" },
    then: {
      operateOn: { component: "input", select: "${attribute.name}" },
      condition: varEqual("attribute.type", "date"),
      writeTo: {
        path: "${attribute.name}",
        formatter: dateFormatter
      }
    }
  }
};


/**
 * Transform for custom fields where we evaluate the name of the custom attribute first,
 * then check if the field is in the incoming attribute list (because if not, then we don't want to evaluate more especially if enum value)
 * Then write the value out depending on if it's a raw value, or if we need to resolve the value, or if it's an array of resolvable values
 */
const enumValueFields = ["Dropdown"];
const arrayEnumValueFields = ["MultiSelect"];

const customFieldsTransform = (attributeList) => {
  return {
    operateOn: { component: "input", select: "custom_fields" },
    expand: { valueName: "customField" },
    then: {
      operateOn: {
        component: "glue",
        route: "getCustomFieldMap",
        select: "${customField.custom_field_definition_id}",
        onUndefined: { component: "glue", route: "forceGetCustomFieldMap", select: "${customField.custom_field_definition_id}"},
        name: "customFieldPath"
      },
      then: {
        condition: or(isVarServiceAttributeInVarList("customFieldPath", attributeList), varEqualVar("customFieldPath", "connector.private_settings.incoming_opportunity_type")),
        then: {
          operateOn: { component: "glue", route: "getCustomFieldMapAll", select: "${customField.custom_field_definition_id}.type", name: "customType" },
          then: [
            {
              operateOn: "${customField.value}",
              expand: true,
              condition: varInArray("customType", arrayEnumValueFields),
              then: {
                operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${operateOn}", onUndefined: { component: "glue", route: "forceGetCustomFieldValueMap", select: "${operateOn}"} },
                writeTo: { path: "${customFieldPath}", appendToArray: "unique" }
              }
            },
            {
              condition: varInArray("customType", enumValueFields),
              // wrapped the following logic in an additional "then" because condition is evaluated after the operateOn
              // which is fine, but a little inefficient in this case, because we don't have to evaluate it to know we don't want to do it
              // so evaluate the condition field outside first
              then: {
                operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${customField.value}", name: "customFieldValue", onUndefined: { component: "glue", route: "forceGetCustomFieldValueMap", select: "${customFieldValue}"} },
                writeTo: { path: "${customFieldPath}", value: "${customFieldValue}" }
              }
            },
            {
              condition: [ not(varInArray("customType", enumValueFields)), not(varInArray("customType", arrayEnumValueFields)) ],
              writeTo: { path: "${customFieldPath}", value: "${customField.value}" }
            }
          ]
        }
      }
    }
  };
};

const addressTransform = [
  { operateOn: { component: "input", select: "address.street"}, writeTo: "addressStreet" },
  { operateOn: { component: "input", select: "address.city"}, writeTo: "addressCity" },
  { operateOn: { component: "input", select: "address.state"}, writeTo: "addressState" },
  { operateOn: { component: "input", select: "address.postalCode"}, writeTo: "addressPostalCode" },
  { operateOn: { component: "input", select: "address.country"}, writeTo: "addressCountry" }
];

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: CopperCRMIncomingLead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "cloneInitialInput" },
    asPipeline: true,
    then: [
      {
        target: { component: "input" },
        then: _.concat(addressTransform, [
            customFieldsTransform("incoming_lead_attributes"),
            createEnumTransformWithAttributeList({
              attribute: "customerSource",
              attributeId: "customer_source_id",
              attributeList: "incoming_lead_attributes",
              route: "getCustomerSources",
              forceRoute: "forceGetCustomerSources"
            }),
            createEnumTransformWithAttributeList({
              attribute: "assigneeEmail",
              attributeId: "assignee_id",
              attributeList: "incoming_lead_attributes",
              route: "getAssignees",
              forceRoute: "forceGetAssignees"
            }),
            {
              operateOn: { component: "input", select: "email.email" },
              writeTo: "primaryEmail"
            }
        ])
      },
      createIncomingServiceUserTransform("lead")
    ]
  },
  {
    input: CopperCRMIncomingPerson,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "cloneInitialInput" },
    asPipeline: true,
    then: [
      {
        target: { component: "input" },
        then: _.concat(addressTransform, customFieldsTransform("incoming_person_attributes"), [
          createEnumTransformWithAttributeList({
            attribute: "contactType",
            attributeId: "contact_type_id",
            attributeList: "incoming_person_attributes",
            route: "getContactTypes",
            forceRoute: "forceGetContactTypes"
          }),
          createEnumTransformWithAttributeList({
            attribute: "assigneeEmail",
            attributeId: "assignee_id",
            attributeList: "incoming_person_attributes",
            route: "getAssignees",
            forceRoute: "forceGetAssignees"
          }),
          {
            operateOn: { component: "input", select: "company_id" },
            writeTo: "hull_service_accountId"
          },
          {
            operateOn: { component: "input", select: "emails[0].email" },
            writeTo: "primaryEmail"
          },
          {
            operateOn: { component: "input", select: "leads_converted_from" },
            writeTo: {
              path: "hull_multiple_anonymous_ids",
              formatter: array => {
                return array.map(value => `coppercrm-person:person-${value.lead_id}`);
              }
            }
          }
        ])
      },
      createIncomingServiceUserTransform("person"),
    ]
  },
  {
    input: CopperCRMIncomingCompany,
    output: ServiceAccountRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "cloneInitialInput" },
    asPipeline: true,
    then: _.concat(addressTransform,
      [
        customFieldsTransform("incoming_account_attributes"),
        createEnumTransformWithAttributeList({
          attribute: "contactType",
          attributeId: "contact_type_id",
          attributeList: "incoming_account_attributes",
          route: "getContactTypes",
          forceRoute: "forceGetContactTypes"
        }),
        createEnumTransformWithAttributeList({
          attribute: "assigneeEmail",
          attributeId: "assignee_id",
          attributeList: "incoming_account_attributes",
          route: "getAssignees",
          forceRoute: "forceGetAssignees"
        })
      ])
  },
  {
    input: CopperCRMIncomingOpportunity,
    output: ServiceOpportunityRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "cloneInitialInput" },
    asPipeline: true,
    then: [
      {
        target: { component: "input" },
        then: [
          {
            operateOn: { component: "input", select: "company_id" },
            writeTo: "hull_service_accountId"
          },
          {
            operateOn: { component: "input", select: "primary_contact_id" },
            condition: not(varNull("operateOn")),
            writeTo: { path: "hull_raw_service_userId", value: "${service_name}-person:person-${operateOn}" }
          },
          {
            operateOn: { component: "input", select: "close_date" },
            writeTo: { path: "close_date", formatter: dateFormatter }
          },
          customFieldsTransform("incoming_opportunity_attributes"),
          createEnumTransformWithAttributeList({
            attribute: "assigneeEmail",
            attributeId: "assignee_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getAssignees",
            forceRoute: "forceGetAssignees"
          }),
          createEnumTransformWithAttributeList({
            attribute: "contactType",
            attributeId: "contact_type_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getContactTypes",
            forceRoute: "forceGetContactTypes"
          }),
          createEnumTransformWithAttributeList({
            attribute: "customerSource",
            attributeId: "customer_source_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getCustomerSources",
            forceRoute: "forceGetCustomerSources"
          }),
          createEnumTransformWithAttributeList({
            attribute: "lossReason",
            attributeId: "loss_reason_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getLossReasons",
            forceRoute: "forceGetLossReasons"
          }),
          createEnumTransformWithAttributeList({
            attribute: "pipeline",
            attributeId: "pipeline_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getPipelines",
            forceRoute: "forceGetPipelines"
          }),
          createEnumTransformWithAttributeList({
            attribute: "pipelineStage",
            attributeId: "pipeline_stage_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getPipelineStages",
            forceRoute: "forceGetPipelineStages"
          }),
          createEnumTransformWithAttributeList({
            attribute: "primaryContactEmail",
            attributeId: "primary_contact_id",
            attributeList: "incoming_opportunity_attributes",
            route: "getPersonEmailById"
          })
        ]
      }
      // convertDatesUsingSchema("opportunitySchema")
    ]
  },
  {
    input: CopperCRMIncomingActivity,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: {
      operateOn: { component: "input", select: "parent.type", name: "eventEntity" },
      validation: {
        condition: not(varInArray("eventEntity", ["person", "lead"])),
        error: "BreakToLoop",
        message: "Event is not owned by a person or a lead"
      },
      then: [
        {
          operateOn: { component: "input", select: "parent.id" },
          writeTo: { path: "ident.anonymous_id", value: "coppercrm-${eventEntity}:${eventEntity}-${operateOn}" }
        },
        {
          operateOn: { component: "input", select: "activity_date" },
          then: [
            { writeTo: { path: "events[0].context.created_at", formatter: value => moment.unix(value).toISOString() } },
            { writeTo: { path: "events[0].properties.created_at", formatter: value => moment.unix(value).toISOString() } },
          ]
        },
        {
          operateOn: { component: "input", select: "id" },
          writeTo: { path: "events[0].context.event_id" }
        },
        {
          operateOn: { component: "input", select: "details" },
          writeTo: { path: "events[0].properties.details" }
        },
        createEnumTransform({
          attribute: "events[0].properties.assigneeEmail",
          attributeId: "user_id",
          route: "getAssignees",
          forceRoute: "forceGetAssignees"
        }),
        createEnumTransform({
          attribute: "events[0].eventName",
          attributeId: "type.id",
          route: "getActivityTypesMap",
          forceRoute: "forceGetActivityTypesMap"
        })
      ]
    }
  }
];


module.exports = transformsToHull;
