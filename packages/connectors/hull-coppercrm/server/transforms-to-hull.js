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
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingAccount,
  CopperCRMIncomingOpportunity
} = require("./service-objects");

/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsToHull: ServiceTransforms = [
  {
    input: CopperCRMIncomingLead,
    output: ServiceUserRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    transforms: [
      {
        target: { component: "cloneInitialInput" },
        then: [
          { operateOn: { component: "input", select: "address.street" }, writeTo: { path: "addressStreet" } },
          { operateOn: { component: "input", select: "address.city" }, writeTo: { path: "addressCity" } },
          { operateOn: { component: "input", select: "address.state" }, writeTo: { path: "addressState" } },
          { operateOn: { component: "input", select: "address.postalCode" }, writeTo: { path: "addressPostalCode" } },
          { operateOn: { component: "input", select: "address.country" }, writeTo: { path: "addressCountry" } },
          {
            operateOn: { component: "input", select: "custom_fields" },
            expand: { valueName: "customField" },
            then: {
              operateOn: { component: "glue", route: "getCustomFields", select: [{ id: "${customField.custom_field_definition_id}" }, "[0]"]},
              writeTo: { path: "${operateOn.name}", format: "${customField.value}" }
            }
          }
        ]
      }
    ]
  }

];

module.exports = transformsToHull;
