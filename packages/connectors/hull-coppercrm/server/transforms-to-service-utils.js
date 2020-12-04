import { createEnumTransformWithAttributeListOutgoing } from "hull-connector-framework/src/purplefusion/transform-predefined";

const {
  varInArray,
  varUndefinedOrNull,
  not
}  = require("hull-connector-framework/src/purplefusion/conditionals");

const _ = require("lodash");

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
      condition: not(varUndefinedOrNull("customField")),
      then: [
        {
          condition: varInArray("customField.type", arrayEnumValueFields),
          then: [
            {
              writeTo: {
                path: "properties.custom_fields",
                appendToArray: true,
                format: {
                  custom_field_definition_id: "${customField.id}"
                }
              }
            },
            {
              target: { component: "target", select: ["properties.custom_fields", { custom_field_definition_id: "${customField.id}" }, "[0]"] },
              operateOn: { component: "input", select: "attributes.${outgoingField.service}" },
              expand: true,
              then: {
                operateOn: {
                  component: "glue",
                  route: "getCustomFieldValueNameMap",
                  select: "${outgoingField.service}.${operateOn}",
                  onUndefined: {
                    component: "glue",
                    route: "forceGetCustomFieldValueNameMap",
                    select: "${outgoingField.service}.${operateOn}"
                  }
                },
                writeTo: {
                  path: "value",
                  appendToArray: "unique",
                }
              }
            }
          ]
        },
        {
          operateOn: { component: "input", select: "attributes.${outgoingField.service}"},
          condition: varInArray("customField.type", enumValueFields),
          // wrapped the following logic in an additional "then" because condition is evaluated after the operateOn
          // which is fine, but a little inefficient in this case, because we don't have to evaluate it to know we don't want to do it
          // so evaluate the condition field outside first
          then: {
            operateOn: {
              component: "glue",
              route: "getCustomFieldValueNameMap",
              select: "${outgoingField.service}.${operateOn}",
              onUndefined: {
                component: "glue",
                route: "forceGetCustomFieldValueNameMap",
                select: "${outgoingField.service}.${operateOn}"
              } },
            writeTo: {
              path: "properties.custom_fields",
              appendToArray: true,
              format: {
                custom_field_definition_id: "${customField.id}",
                value: "${operateOn}"
              }
            }
          }
        },
        {
          condition: [not(varInArray("customField.type", enumValueFields)), not(varInArray("customField.type", arrayEnumValueFields))],
          operateOn: {
            component: "input",
            select: "attributes.${outgoingField.service}"
          },
          writeTo: {
            path: "properties.custom_fields",
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
    operateOn: { component: "input", select: "attributes.addressStreet" },
    writeTo: "properties.address.street"
  },
  {
    operateOn: { component: "input", select: "attributes.addressCity" },
    writeTo: "properties.address.city"
  },
  {
    operateOn: { component: "input", select: "attributes.addressState" },
    writeTo: "properties.address.state"
  },
  {
    operateOn: { component: "input", select: "attributes.addressPostalCode" },
    writeTo: "properties.address.postalCode"
  },
  {
    operateOn: { component: "input", select: "attributes.addressCountry" },
    writeTo: "properties.address.country"
  }
];

const leadTransformations = _.concat(
  {
    // this sends all of the default values that can be taken as is
    operateOn: {
      component: "static",
      object: require("./fields/lead_fields"),
      select: { readOnly: false, needsTranslation: false }
    },
    expand: { valueName: "leadField" },
    then: {
      operateOn: {
        component: "input",
        select: "attributes.${leadField.name}"
      },
      writeTo: {
        path: "properties.${leadField.name}"
      }
    }
  },
  addressTransform,
  {
    operateOn: { component: "input", select: "attributes.primaryEmail" },
    condition: not(varUndefinedOrNull("operateOn")),
    writeTo: {
      path: "properties.email",
      format:
        {
          email: "${operateOn}",
          category: "other"
        }
    }
  },
  createEnumTransformWithAttributeListOutgoing({
    attribute: "customerSource",
    writePath: "properties.customer_source_id",
    attributeList: "outgoing_lead_attributes",
    route: "getCustomerSourcesId",
    forceRoute: "forceGetCustomerSourcesId",
    formatOnNull: null
  }),
  createEnumTransformWithAttributeListOutgoing({
    attribute: "assigneeEmail",
    writePath: "properties.assignee_id",
    attributeList: "outgoing_lead_attributes",
    route: "getAssigneeIds",
    forceRoute: "forceGetAssigneeIds",
    formatOnNull: null
  }),
  customFieldsTransform("outgoing_lead_attributes")
);

module.exports = {
  leadTransformations
};
