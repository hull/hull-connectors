/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import {
  isEqual,
  isNotEqual,
  varUndefinedOrNull,
  not,
  mappingExists, inputIsNotEmpty, inputIsEmpty
} from "hull-connector-framework/src/purplefusion/conditionals";
import { HullIncomingAccount, HullIncomingUser } from "hull-connector-framework/src/purplefusion/hull-service-objects";
import { IntercomIncomingCompany, IntercomIncomingUser, IntercomIncomingLead } from "./service-objects";


const contactTransformation = [
  {
    operateOn: "${connector.private_settings.sync_fields_to_hull}",
    expand: { valueName: "mapping" },
    then: [
      {
        operateOn: { component: "input", select: "custom_attributes.${mapping.name}", name: "serviceValue"},
        condition: isNotEqual("serviceValue", undefined),
        then: [
          {
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "set", value: "${operateOn}" } }
          }
        ]
      },
      {
        operateOn: { component: "input", select: "${mapping.name}", name: "serviceValue"},
        condition: isNotEqual("serviceValue", undefined),
        then: [
          {
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "set", value: "${operateOn}" } }
          }
        ]
      }
    ]
  },
  {
    condition: inputIsNotEmpty("tags.data"),
    then: [
      {
        operateOn: { component: "glue", route: "getContactTags", name: "contactTags" },
        expand: { valueName: "contactTag" },
        then: [
          {
            writeTo: {
              path: "attributes.intercom/tags",
              appendToArray: "unique",
              format: "${contactTag.name}",
            }
          }
        ]
      }
    ]
  },
  {
    condition: inputIsEmpty("tags.data"),
    then: [
      {
        writeTo: {
          path: "attributes.intercom/tags",
          format: [],
        }
      }
    ]
  },
  {
    operateOn: "${connector.private_settings.user_claims}",
    expand: { valueName: "mapping" },
    then: {
      operateOn: { component: "input", select: "${mapping.service}"},
      condition: not(varUndefinedOrNull("operateOn")),
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
];

const transformsToService: ServiceTransforms = [
  {
    input: IntercomIncomingUser,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: contactTransformation
  },
  {
    input: IntercomIncomingLead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: contactTransformation
  },
  {
    input: IntercomIncomingCompany,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: "${connector.private_settings.incoming_account_attributes}",
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: { component: "input", select: "custom_attributes.${mapping.service}", name: "serviceValue"},
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
          },
          {
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
          },
          {
            operateOn: { component: "input", select: "tags.tags" },
            expand: { valueName: "tag" },
            condition: [
              mappingExists("incoming_account_attributes", { service: "tags" }),
              inputIsNotEmpty("tags.tags")
            ],
            then: [
              {
                writeTo: {
                  path: "attributes.intercom/tags",
                  appendToArray: "unique",
                  format: "${tag.name}",
                }
              }
            ]
          },
          {
            operateOn: { component: "input", select: "tags.tags" },
            condition: [
              mappingExists("incoming_account_attributes", { service: "tags" }),
              inputIsEmpty("tags.tags")
            ],
            then: [
              { writeTo: { path: "attributes.intercom/tags" } }
            ]
          }
        ]
      },
      {
        operateOn: "${connector.private_settings.account_claims}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "${mapping.service}"},
          condition: not(varUndefinedOrNull("operateOn")),
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
  }
];

module.exports = transformsToService;
