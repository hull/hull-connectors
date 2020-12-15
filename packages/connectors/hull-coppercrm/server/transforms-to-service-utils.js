import { createEnumTransformWithAttributeListOutgoing } from "hull-connector-framework/src/purplefusion/transform-predefined";

const {
  varInArray,
  varUndefinedOrNull,
  not
}  = require("hull-connector-framework/src/purplefusion/conditionals");

const _ = require("lodash");

const enumValueFields = ["Dropdown"];
const arrayEnumValueFields = ["MultiSelect"];

const customFieldsTransform = (attributeList, propertiesPrefix) => {
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
                path: propertiesPrefix + "custom_fields",
                appendToArray: true,
                format: {
                  custom_field_definition_id: "${customField.id}"
                }
              }
            },
            {
              target: { component: "target", select: [propertiesPrefix + "custom_fields", { custom_field_definition_id: "${customField.id}" }, "[0]"] },
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
              path: propertiesPrefix + "custom_fields",
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
            path: propertiesPrefix + "custom_fields",
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

const createAddressTransform = (prefix) => [
  {
    operateOn: { component: "input", select: "attributes.addressStreet" },
    writeTo: prefix + "address.street"
  },
  {
    operateOn: { component: "input", select: "attributes.addressCity" },
    writeTo: prefix + "address.city"
  },
  {
    operateOn: { component: "input", select: "attributes.addressState" },
    writeTo: prefix + "address.state"
  },
  {
    operateOn: { component: "input", select: "attributes.addressPostalCode" },
    writeTo: prefix + "address.postalCode"
  },
  {
    operateOn: { component: "input", select: "attributes.addressCountry" },
    writeTo: prefix + "address.country"
  }
];


const createLeadTransformation = (prefix) => _.concat(
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
        path: prefix + "${leadField.name}"
      }
    }
  },
  createAddressTransform(prefix),
  {
    operateOn: { component: "input", select: "attributes.primaryEmail" },
    condition: not(varUndefinedOrNull("operateOn")),
    writeTo: {
      path: prefix + "email",
      format:
        {
          email: "${operateOn}",
          category: "other"
        }
    }
  },
  createEnumTransformWithAttributeListOutgoing({
    attribute: "customerSource",
    writePath: prefix + "customer_source_id",
    attributeList: "outgoing_lead_attributes",
    route: "getCustomerSourcesId",
    forceRoute: "forceGetCustomerSourcesId",
    formatOnNull: null
  }),
  createEnumTransformWithAttributeListOutgoing({
    attribute: "assigneeEmail",
    writePath: prefix + "assignee_id",
    attributeList: "outgoing_lead_attributes",
    route: "getAssigneeIds",
    forceRoute: "forceGetAssigneeIds",
    formatOnNull: null
  }),
  customFieldsTransform("outgoing_lead_attributes", prefix)
);

const createPersonTransformation = () => _.concat(
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
  createAddressTransform(""),
  {
    operateOn: { component: "input", select: "attributes.primaryEmail" },
    condition: not(varUndefinedOrNull("operateOn")),
    writeTo: {
      path: "emails",
      format: [
        {
          email: "${operateOn}",
          category: "other"
        }
      ]
    }
  },
  {
    operateOn: { component: "input", select: "hull_service_accountId" },
    writeTo: "company_id"
  },
  createEnumTransformWithAttributeListOutgoing({
    attribute: "customerSource",
    writePath: "customer_source_id",
    attributeList: "outgoing_user_attributes",
    route: "getCustomerSourcesId",
    forceRoute: "forceGetCustomerSourcesId",
    formatOnNull: null
  }),
  createEnumTransformWithAttributeListOutgoing({
    attribute: "assigneeEmail",
    writePath: "assignee_id",
    attributeList: "outgoing_user_attributes",
    route: "getAssigneeIds",
    forceRoute: "forceGetAssigneeIds",
    formatOnNull: null
  }),
  customFieldsTransform("outgoing_user_attributes", "")
);

module.exports = {
  createLeadTransformation,
  createPersonTransformation
};
