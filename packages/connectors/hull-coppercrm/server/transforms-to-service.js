/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  HullLeadRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead
} = require("./service-objects");

const {
  varUndefined,
  varUndefinedOrNull,
  varEqual,
  not
} = require("hull-connector-framework/src/purplefusion/conditionals");

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
            not(varInArray("customField.type", arrayEnumValueFields))
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
  },
  {
    input: HullUserRaw2,
    output: CopperCRMOutgoingContact,
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
              email: "mycontact_1233@noemail.com",
              category: "other"
            }
          ]
        }
      },
      {
        operateOn: { component: "input", select: "hull_service_account_id" },
        writeTo: {
          // whereever you need to put the id to link it to an account
        }
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
          writeTo: "${personField.name}"
        }
      },
      createEnumTransformWithAttributeListOutgoing({
        attribute: "assigneeEmail",
        writePath: "assignee_id",
        attributeList: "outgoing_user_attributes",
        route: "getAssigneeIds",
        forceRoute: "forceGetAssigneeIds",
        formatOnNull: null
      })
      // TODO handle primary email, handle other...
      // customFieldsTransform("outgoing_user_attributes")
    )
  }
];

module.exports = transformsToHull;
