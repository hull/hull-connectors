/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
const _ = require("lodash");

const {
  HullIncomingUser,
  ServiceAccountRaw,
  ServiceOpportunityRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { createIncomingServiceUserTransform, createEnumTransform }  = require("hull-connector-framework/src/purplefusion/transform-predefined");

const { varNull, varInArray, not, isVarServiceAttributeInVarList }  = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity
} = require("./service-objects");


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
        condition: isVarServiceAttributeInVarList("customFieldPath", attributeList),
        then: {
          operateOn: { component: "glue", route: "getCustomFieldMapAll", select: "${customField.custom_field_definition_id}.type", name: "customType" },
          then: [
            {
              operateOn: "${customField.value}",
              expand: true,
              condition: varInArray("customType", arrayEnumValueFields),
              then: {
                operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${operateOn}" },
                writeTo: { path: "${customFieldPath}", appendToArray: "unique" }
              }
            },
            {
              operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${customField.value}", name: "customFieldValue" },
              condition: varInArray("customType", enumValueFields),
              writeTo: { path: "${customFieldPath}", value: "${customFieldValue}" }
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
            createEnumTransform({
              attribute: "customerSource",
              attributeId: "customer_source_id",
              attributeList: "incoming_lead_attributes",
              route: "getCustomerSources",
              forceRoute: "forceGetCustomerSources"
            }),
            createEnumTransform({
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
          createEnumTransform({
            attribute: "contactType",
            attributeId: "contact_type_id",
            attributeList: "incoming_person_attributes",
            route: "getContactTypes",
            forceRoute: "forceGetContactTypes"
          }),
          createEnumTransform({
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
    then: _.concat(addressTransform,
      [
        customFieldsTransform("incoming_account_attributes"),
        createEnumTransform({
          attribute: "contactType",
          attributeId: "contact_type_id",
          attributeList: "incoming_account_attributes",
          route: "getContactTypes",
          forceRoute: "forceGetContactTypes"
        }),
        createEnumTransform({
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
      customFieldsTransform("incoming_opportunity_attributes"),
      createEnumTransform({
        attribute: "assigneeEmail",
        attributeId: "assignee_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getAssignees",
        forceRoute: "forceGetAssignees"
      }),
      createEnumTransform({
        attribute: "contactType",
        attributeId: "contact_type_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getContactTypes",
        forceRoute: "forceGetContactTypes"
      }),
      createEnumTransform({
        attribute: "customerSource",
        attributeId: "customer_source_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getCustomerSources",
        forceRoute: "forceGetCustomerSources"
      }),
      createEnumTransform({
        attribute: "lossReason",
        attributeId: "loss_reason_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getLossReason",
        forceRoute: "forceGetLossReason"
      }),
      createEnumTransform({
        attribute: "pipeline",
        attributeId: "pipeline_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getPipelines",
        forceRoute: "forceGetPipelines"
      }),
      createEnumTransform({
        attribute: "pipelineStage",
        attributeId: "pipeline_stage_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getPipelineStages",
        forceRoute: "forceGetPipelineStages"
      }),
      createEnumTransform({
        attribute: "primaryContactEmail",
        attributeId: "primary_contact_id",
        attributeList: "incoming_opportunity_attributes",
        route: "getPersonEmailById",
        forceRoute: "forceGetPersonEmailById"
      })
    ]
  }
];

module.exports = transformsToHull;
