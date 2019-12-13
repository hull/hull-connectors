/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
const _ = require("lodash");

const {
  HullIncomingUser,
  ServiceAccountRaw,
  ServiceOpportunityRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { createIncomingServiceUserTransform }  = require("hull-connector-framework/src/purplefusion/transform-predefined");

const { doesContain, doesNotContain }  = require("hull-connector-framework/src/purplefusion/conditionals");



const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity
} = require("./service-objects");


const addressTransform = [
  { operateOn: { component: "input", select: "address.street"}, writeTo: "addressStreet" },
  { operateOn: { component: "input", select: "address.city"}, writeTo: "addressCity" },
  { operateOn: { component: "input", select: "address.state"}, writeTo: "addressState" },
  { operateOn: { component: "input", select: "address.postalCode"}, writeTo: "addressPostalCode" },
  { operateOn: { component: "input", select: "address.country"}, writeTo: "addressCountry" }
];


const enumFields = ["Dropdown", "MultiSelect"];
const arrayEnumFields = ["MultiSelect"];

const customFieldsTransform = [
  {
    operateOn: { component: "input", select: "custom_fields" },
    expand: { valueName: "customField" },
    then: {
      operateOn: { component: "glue", route: "getCustomFieldMap", select: "${customField.custom_field_definition_id}", name: "customFieldPath" },
      then: [
        {
          operateOn: { component: "glue", route: "getCustomFieldMapAll", select: "${customField.custom_field_definition_id}.type", name: "customType" },
          condition: doesContain(enumFields, "customType"),
          then: [
            {
              operateOn: "${customField.value}",
              expand: true,
              condition: doesContain(arrayEnumFields, "customType"),
              then: {
                operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${operateOn}" },
                writeTo: { path: "${customFieldPath}", appendToArray: "unique" }
              }
            },
            {
              operateOn: { component: "glue", route: "getCustomFieldValueMap", select: "${customField.value}", name: "customFieldValue" },
              condition: doesNotContain(arrayEnumFields, "customType"),
              writeTo: { path: "${customFieldPath}", value: "${customFieldValue}" }
            }
          ]
        },
        {
          operateOn: { component: "glue", route: "getCustomFieldMapAll", select: "${customField.custom_field_definition_id}.type", name: "customType" },
          condition: doesNotContain(enumFields, "customType"),
          writeTo: { path: "${customFieldPath}", value: "${customField.value}" }
        }
      ]
    }
  }
];

const assigneesTransform = [
  {
    operateOn: { component: "glue", route: "getAssignees", select: { component: "input", select: "assignee_id" } },
    writeTo: "assigneeEmail"
  }
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
        then: _.concat(addressTransform, customFieldsTransform, assigneesTransform, [
            {
              operateOn: {
                component: "glue",
                route: "getCustomerSources",
                select: { component: "input", select: "customer_source_id" }
              },
              writeTo: "customerSource"
            },
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
        then: _.concat(addressTransform, customFieldsTransform, assigneesTransform,
          [
            {
              operateOn: { component: "input", select: "company_id" },
              writeTo: "hull_service_accountId"
            },
            {
              operateOn: { component: "glue", route: "getContactTypes", select: { component: "input", select: "contact_type_id" } },
              writeTo: "contactType"
            },
            {
              // TODO need to be carefule because if full path isn't found in latest context, even if "input" is there, it will keep traversing back through object stack
              // producing some not-straightforward behavior
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
    then: _.concat(addressTransform, customFieldsTransform, assigneesTransform,
      [
        {
          operateOn: { component: "glue", route: "getContactTypes", select: { component: "input", select: "contact_type_id" } },
          writeTo: "contactType"
        }
      ])
  },
  {
    input: CopperCRMIncomingOpportunity,
    output: ServiceOpportunityRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "cloneInitialInput" },
    then: _.concat(customFieldsTransform, assigneesTransform, [
      {
        operateOn: { component: "input", select: "company_id" },
        writeTo: "hull_service_accountId"
      },
      {
        operateOn: { component: "input", select: "primary_contact_id" },
        writeTo: { path: "hull_raw_service_userId", value: "${service_name}-person:person-${operateOn}" }
      },
      {
        operateOn: { component: "glue", route: "getContactTypes", select: { component: "input", select: "contact_type_id" } },
        writeTo: "contactType"
      },
      {
        operateOn: { component: "glue", route: "getCustomerSources", select: { component: "input", select: "customer_source_id" } },
        // default null?
        writeTo: "customerSource"
      },
      {
        operateOn: { component: "glue", route: "getLossReason", select: { component: "input", select: "loss_reason_id" } },
        writeTo: "lossReason"
      },
      {
        operateOn: { component: "glue", route: "getPipelines", select: { component: "input", select: "pipeline_id" } },
        // default null?
        writeTo: "pipeline"
      },
      {
        operateOn: { component: "glue", route: "getPipelineStages", select: { component: "input", select: "pipeline_stage_id" } },
        // default null?
        writeTo: "pipelineStage"
      },
      {
        operateOn: { component: "glue", route: "getAssignees", select: { component: "input", select: "primary_contact_id" } },
        // default null?
        writeTo: "primaryContactEmail"
      }
    ])
  }
];

module.exports = transformsToHull;
