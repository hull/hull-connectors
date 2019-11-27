/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  inputIsEqual,
  inputIsNotEqual,
  isNotEqual,
  isEqual
} = require("hull-connector-framework/src/purplefusion/conditionals");

const _ = require("lodash");

const {
  ServiceUserRaw,
  ServiceLeadRaw,
  ServiceAccountRaw,
  ServiceOpportunityRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingAccount,
  CopperCRMIncomingOpportunity
} = require("./service-objects");

const addressTransform = [
  { operateOn: { component: "input", select: "address.street" }, writeTo: { path: "addressStreet" } },
  { operateOn: { component: "input", select: "address.city" }, writeTo: { path: "addressCity" } },
  { operateOn: { component: "input", select: "address.state" }, writeTo: { path: "addressState" } },
  { operateOn: { component: "input", select: "address.postalCode" }, writeTo: { path: "addressPostalCode" } },
  { operateOn: { component: "input", select: "address.country" }, writeTo: { path: "addressCountry" } }
  ];
const customFieldsTransform = [
  {
    operateOn: { component: "input", select: "custom_fields" },
    expand: { valueName: "customField" },
    then: {
      operateOn: { component: "glue", route: "getCustomFields", select: [{ id: "${customField.custom_field_definition_id}" }, "[0]"]},
      writeTo: { path: "${operateOn.name}", format: "${customField.value}" }
    }
  }
  ];
const assigneesTransform = [
  {
    operateOn: { component: "glue", route: "getAssignees", select: [{ id: { component: "input", select: "assignee_id" } }, "[0].email"] },
    writeTo: { path: "assigneeEmail" }
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
    output: ServiceLeadRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    transforms: [
      {
        target: { component: "cloneInitialInput" },
        then: _.concat(addressTransform, customFieldsTransform, assigneesTransform,
          [
            {
              operateOn: { component: "glue", route: "getCustomerSources", select: [{ id: { component: "input", select: "customer_source_id" } }, "[0].email"] },
              // default null?
              writeTo: { path: "customerSource" }
            }
          ])
      }
    ]
  },
  {
    input: CopperCRMIncomingPerson,
    output: ServiceUserRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    transforms: [
      {
        target: { component: "cloneInitialInput" },
        then: _.concat(addressTransform, customFieldsTransform, assigneesTransform,
          [
            {
              operateOn: { component: "input", select: "company_id" },
              writeTo: { path: "hull_service_accountId" }
            },
            {
              operateOn: { component: "glue", route: "getContactTypes", select: [{ id: { component: "input", select: "contact_type_id" } }, "[0].name"] },
              // default null?
              writeTo: { path: "contactType" }
            },
            {
              operateOn: { component: "input", select: "emails[0].email" },
              writeTo: { path: "email" }
            }
          ])
      }
    ]
  },
  {
    input: CopperCRMIncomingAccount,
    output: ServiceAccountRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    transforms: [
      {
        target: { component: "cloneInitialInput" },
        then: _.concat(addressTransform, customFieldsTransform, assigneesTransform,
          [
            {
              operateOn: { component: "glue", route: "getContactTypes", select: [{ id: { component: "input", select: "contact_type_id" } }, "[0].name"] },
              // default null?
              writeTo: { path: "contactType" }
            }
          ])
      }
    ]
  },
  {
    input: CopperCRMIncomingOpportunity,
    output: ServiceOpportunityRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    transforms: [
      {
        target: { component: "cloneInitialInput" },
        then: _.concat(customFieldsTransform, assigneesTransform, [
          {
            operateOn: { component: "input", select: "company_id" },
            writeTo: { path: "hull_service_accountId" }
          },
          {
            operateOn: { component: "glue", route: "getContactTypes", select: [{ id: { component: "input", select: "contact_type_id" } }, "[0].name"] },
            // default null?
            writeTo: { path: "contactType" }
          },
          {
            operateOn: { component: "glue", route: "getCustomerSources", select: [{ id: { component: "input", select: "customer_source_id" } }, "[0].name"] },
            // default null?
            writeTo: { path: "customerSource" }
          },
          {
            operateOn: { component: "input", select: "loss_reason_id", name: "lossReasonId"},
            then: {
              operateOn: { component: "glue", route: "getLossReason" },
              // default null?
              writeTo: { path: "lossReason" }
            }
          },
          {
            operateOn: { component: "glue", route: "getPipelines", select: [{ id: { component: "input", select: "pipeline_id" } }, "[0].name"] },
            // default null?
            writeTo: { path: "pipeline" }
          },
          {
            operateOn: { component: "glue", route: "getPipelineStages", select: [{ id: { component: "input", select: "pipeline_stage_id" } }, "[0].name"] },
            // default null?
            writeTo: { path: "pipelineStage" }
          },
          {
            operateOn: { component: "glue", route: "getAssignees", select: [{ id: { component: "input", select: "primary_contact_id" } }, "[0].name"] },
            // default null?
            writeTo: { path: "primaryContactEmail" }
          }
        ])
      }
    ]
  }
];

module.exports = transformsToHull;
