/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  doesNotContain,
  inputIsEqual,
  isEqual,
  doesContain,
  inputIsNotEqual,
  isNotEqual,
  isServiceAttribute,
  not,
  notNull,
  varUndefinedOrNull,
  varEmpty
} = require("./conditionals");

const {
  getAttributeName,
  getAttributeNamespace
} = require("./utils");

const {
  createIncomingServiceUserTransform
} = require("./transform-predefined");

const {
  HullUserRaw,
  HullUserRaw2,
  HullLeadRaw,
  ServiceUserRaw,
  ServiceAccountRaw,
  ServiceOpportunityRaw,
  HullIncomingUser,
  HullIncomingAccount,
  HullOutgoingUser,
  HullIncomingUserImportApi,
  HullConnectorAttributeDefinition,
  HullIncomingDropdownOption,
  HullOutgoingDropdownOption,
  HullApiAttributeDefinition,
  HullIncomingOpportunity
} = require("./hull-service-objects");


/**
 * On the way back still need the notion of putting into the identification
 * versus setting attributes
 * @type {[type]}
 */
const transformsShared: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: HullLeadRaw,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: "${connector.private_settings.outgoing_lead_attributes}",
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: { component: "input", select: "user.${mapping.hull}" },
            condition: [
              not(varEmpty("mapping.hull")),
              not(varEmpty("mapping.service")),
            ],
            writeTo: { path: "attributes.${mapping.service}" }
          },
          {
            // for account mappints
            operateOn: { component: "input", select: "${mapping.hull}" },
            condition: [
              not(varEmpty("mapping.hull")),
              not(varEmpty("mapping.service")),
            ],
            writeTo: { path: "attributes.${mapping.service}" }
          },
        ]
      },
      // {
      //   operateOn: { component: "input", select: "${service_name}_lead/id" },
      //   condition: not(varUndefinedOrNull("${operateOn}")),
      //   writeTo: {
      //     appendToArray: true,
      //     path: "ident",
      //     format: {
      //       hull: "${service_name}_lead/id",
      //       service: "id",
      //       value: "${operateOn}"
      //     }
      //   }
      // },
      {
        operateOn: "${connector.private_settings.lead_claims}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "user.${mapping.hull}"},
          condition: [
            not(varEmpty("mapping.service")),
            not(varUndefinedOrNull("operateOn"))
          ],
          writeTo: {
            appendToArray: true,
            path: "ident",
            format: {
              hull: "${mapping.hull}",
              service: "${mapping.service}",
              value: "${operateOn}"
            }
          }
        }
      },
    ]
  },
  {
    input: HullOutgoingUser,
    output: HullUserRaw,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "outgoing",
    transforms: [
      // take default user id if possible
      // { inputPath: "${service_name}/id", outputPath: "id" },
      // // or pass in as a variable if needed
      // { outputPath: "id", outputFormat: "${userId}" },
      // // set an account id if there's a variable with one, maybe put a "link user" logic ?
      // // need to see how it plays out
      // { outputPath: "${service_name}-accountId", outputFormat: "${accountId}" },

      // not sure if this is the way we want to do this...
      // link users in service may mean something more complex...
      {
        condition: isEqual("connector.private_settings.link_users_in_service", true),
        inputPath: "account.${service_name}/id",
        outputPath: "hull_service_accountId"
      },
      {
        mapping: "connector.private_settings.outgoing_user_associated_account_id",
        condition: not(varEmpty("hull_field_name")),
        inputPath: "user.${hull_field_name}",
        outputPath: "hull_service_accountId"
      },
      {
        // this transform is for account attributes mapped to the user level
        // the account attribute will be labeled account.X
        mapping: "connector.private_settings.outgoing_user_attributes",
        condition: [
          not(varEmpty("hull_field_name")),
          not(varEmpty("service_field_name"))
        ],
        inputPath: "${hull_field_name}",
        outputPath: "${service_field_name}",
      },
      {
        mapping: "connector.private_settings.outgoing_user_attributes",
        condition: [
          not(varEmpty("hull_field_name")),
          not(varEmpty("service_field_name"))
        ],
        inputPath: "user.${hull_field_name}",
        outputPath: "${service_field_name}",
      },
      {
        mapping: "connector.private_settings.user_claims",
        condition: [
          not(varEmpty("hull_field_name")),
          not(varEmpty("service_field_name"))
        ],
        inputPath: "user.${hull_field_name}",
        outputPath: "${service_field_name}"
      }
    ]
  },
  {
    input: HullOutgoingUser,
    output: HullUserRaw2,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: "${connector.private_settings.outgoing_user_attributes}",
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: { component: "input", select: "user.${mapping.hull}" },
            writeTo: { path: "attributes.${mapping.service}" }
          },
          {
            // for account mappings
            operateOn: { component: "input", select: "${mapping.hull}" },
            writeTo: { path: "attributes.${mapping.service}" }
          }
        ]
      },
      {
        operateOn: "${connector.private_settings.user_claims}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "user.${mapping.hull}" },
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: {
            appendToArray: true,
            path: "ident",
            format: {
              hull: "${mapping.hull}",
              service: "${mapping.service}",
              value: "${operateOn}"
            }
          }
        }
      },
      {
        condition: isEqual(
          "connector.private_settings.link_users_in_service",
          true
        ),
        inputPath: "account.${service_name}/id",
        outputPath: "hull_service_accountId"
      },
      {
        mapping:
          "connector.private_settings.outgoing_user_associated_account_id",
        inputPath: "user.${hull_field_name}",
        outputPath: "hull_service_accountId"
      }
    ]
  },
  {
    input: ServiceUserRaw,
    output: HullIncomingUser,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: "connector.private_settings.incoming_user_attributes",
        condition: isNotEqual("value", "null"),
        inputPath: "${service_field_name}",
        //don't need service_name because hull automatically appends it
        outputPath: "attributes.${hull_field_name}",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      },
      {
        mapping: { type: "input" },
        condition: [
          isEqual("connector.private_settings.fetch_all_attributes", true),
          not(isServiceAttribute("connector.private_settings.incoming_user_attributes", "service_field_name")),
          not(isEqual("service_field_name", "hull_events")),
          isNotEqual("value", "null"),
        ],
        inputPath: "${service_field_name}",
        outputPath: "attributes.${service_name}/${hull_field_name}",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      },
      {
        inputPath: "id",
        outputPath: "ident.anonymous_id",
        outputFormat: "${service_name}:${value}"
      },
      {
        condition: isEqual("connector.private_settings.link_users_in_hull", true),
        inputPath: "hull_service_accountId",
        outputPath: "accountIdent.anonymous_id",
        outputFormat: "${service_name}:${value}"
      },
      {
        condition: isEqual("connector.private_settings.link_users_in_hull", true),
        inputPath: "hull_service_accountId",
        outputPath: "accountAttributes.${service_name}/id",
        outputFormat: "${value}"
      },
      {
        inputPath: "id",
        outputPath: "attributes.${service_name}/id",
        outputFormat: {
          value: "${value}",
          operation: "set"
        }
      },
      {
        arrayStrategy: "pick_first",
        mapping: "connector.private_settings.user_claims",
        inputPath: "${service_field_name}",
        outputPath: "ident.${hull_field_name}"
      },
      {
        arrayStrategy: "send_raw_array",
        inputPath: "hull_multiple_anonymous_ids",
        outputPath: "ident.anonymous_ids"
      },
      {
        arrayStrategy: "send_raw_array",
        inputPath: "hull_events",
        outputPath: "events"
      }
    ]
  },
  {
    input: ServiceAccountRaw,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: "${connector.private_settings.incoming_account_attributes}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "${mapping.service}", name: "serviceValue"},
          condition: isNotEqual("serviceValue", undefined),
          then: [
            {
              condition: isEqual("mapping.overwrite", false),
              writeTo: { path: "attributes.${mapping.hull}", format: { operation: "setIfNull", value: "${operateOn}" } }
            },
            {
              condition: isEqual("mapping.overwrite", true),
              writeTo: { path: "attributes.${mapping.hull}", format: { operation: "set", value: "${operateOn}" } }
            }
          ]
        }
      },
      {
        operateOn: "${connector.private_settings.account_claims}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "${mapping.service}"},
          writeTo: { path: "ident.${mapping.hull}" }
        }
      },
      {
        operateOn: { component: "input", select: "id" },
        then:[
          { writeTo: { path: "ident.anonymous_id", format: "${service_name}:${operateOn}" } },
          { writeTo: { path: "attributes.${service_name}/id", format: { operation: "set", value: "${operateOn}" } } }
        ]
      },
      {
        operateOn: { component: "input", select: "name" },
        condition: not(varUndefinedOrNull("operateOn")),
        writeTo: { path: "attributes.name", format: { operation: "setIfNull", value: "${operateOn}" } }
      }
    ]
  },
  {
    input: ServiceOpportunityRaw,
    output: HullIncomingOpportunity,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "hull_service_accountId" },
        condition: not(varUndefinedOrNull("operateOn")),
        // validation: { error: "BreakLoop", message: "Opp doesn't have company", condition: [ inputIsNotEqual("company_id", null), inputIsNotEqual("company_id", undefined) ] },
        writeTo: { path: "accountIdent.anonymous_id", format: "${service_name}:${operateOn}" },
      },
      // {
      //   operateOn: { component: "input", select: "hull_raw_service_accountId" },
      //   writeTo: { path: "accountIdent.anonymous_id", format: "${service_name}:${operateOn}" },
      // },
      {
        operateOn: { component: "input", select: "hull_service_userId" },
        condition: not(varUndefinedOrNull("operateOn")),
        writeTo: { path: "userIdent.anonymous_id", format: "${service_name}:${operateOn}" },
      },
      {
        operateOn: { component: "input", select: "hull_raw_service_userId" },
        writeTo: { path: "userIdent.anonymous_id" },
      },
      {
        operateOn: { component: "input", select: "${connector.private_settings.incoming_opportunity_type}", name: "opportunityType"},
        condition: notNull("opportunityType", undefined),
        then: [
          {
            operateOn: { component: "input", select: "id" },
            writeTo: {
              path: "attributes.${service_name}_opportunity_${opportunityType}/id",
              format: {
                value: "${operateOn}",
                operation: "set"
              }
            }
          },
          {
            operateOn: "${connector.private_settings.incoming_opportunity_attributes}",
            expand: { valueName: "mapping" },
            then: {
              operateOn: { component: "input", select: "${mapping.service}", name: "serviceValue"},
              condition: isNotEqual("serviceValue", undefined),
              then: [
                {
                  condition: isEqual("mapping.overwrite", true),
                  writeTo: {
                    path: "attributes.${service_name}_opportunity_${opportunityType}/${mapping.hull}",
                    format: { operation: "set", value: "${operateOn}" }
                  }
                },
                {
                  condition: isEqual("mapping.overwrite", false),
                  writeTo: {
                    path: "attributes.${service_name}_opportunity_${opportunityType}/${mapping.hull}",
                    format: { operation: "setIfNull", value: "${operateOn}" }
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    input: HullIncomingUser,
    output: HullIncomingUserImportApi,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input", path: "attributes" },
        inputPath: "attributes.${service_field_name}.value",
        //don't need service_name because hull automatically appends it
        outputPath: "traits.${hull_field_name}"
      },
      {
        inputPath: "ident.external_id",
        outputPath: "userId"
      },
      {
        inputPath: "ident.email",
        outputPath: "traits.email"
      },
      {
        inputPath: "ident.anonymous_id",
        outputPath: "traits.anonymous_id"
      },
      //TODO not sure if external_id or anonymous id is used for import api accountId
      {
        inputPath: "accountIdent.external_id",
        outputPath: "accountId"
      },
    ]
  },
  {
    input: HullApiAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [`$.{ "name": ($contains(key, /^traits_/) ? $substring(key, 7) : key), "type": type, "display": key }`]
  },
  {
    input: HullConnectorAttributeDefinition,
    output: HullIncomingDropdownOption,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [`{ "data": { "options": $.{"value": name, "label": display } }, "status": 200 }`]
  },
  {
    input: HullConnectorAttributeDefinition,
    output: HullOutgoingDropdownOption,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [`$[readOnly=false]{ "data": {"options": $.{"value": name, "label": display } }, "status": 200 }`]
  }
];

module.exports = transformsShared;
