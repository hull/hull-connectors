/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import {
  isEqual,
  isNotEqual,
  not,
  varEqual,
  varInArray,
  varUndefinedOrNull
} from "hull-connector-framework/src/purplefusion/conditionals";
import {
  SalesforceTaskRead,
  SalesforceContactRead,
  SalesforceLeadRead,
  SalesforceAccountRead
} from "./service-objects";
import {
  HullIncomingEvent,
  HullIncomingUser,
  HullIncomingAccount
} from "hull-connector-framework/src/purplefusion/hull-service-objects";

function serviceUserTransformation({ entityType }) {
  return [
    {
      operateOn: { component: "input", select: "FirstName" },
      condition: not(varUndefinedOrNull("operateOn")),
      writeTo: {
        path: "attributes.first_name",
        format: { operation: "setIfNull", value: "${operateOn}" }
      }
    },
    {
      operateOn: { component: "input", select: "LastName" },
      condition: not(varUndefinedOrNull("operateOn")),
      writeTo: {
        path: "attributes.last_name",
        format: { operation: "setIfNull", value: "${operateOn}" }
      }
    },
    {
      operateOn: `\${connector.private_settings.${entityType}_claims}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: {
          component: "input",
          select: "${mapping.service}",
          name: "serviceValue"
        },
        condition: not(varUndefinedOrNull("serviceValue")),
        writeTo: {
          path: "ident.${mapping.hull}"
        }
      }
    },
    {
      operateOn: `\${connector.private_settings.${entityType}_attributes_inbound}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: {
          component: "input",
          select: "${mapping.service}",
          name: "serviceValue"
        },
        condition: [not(varEqual("serviceValue", undefined))],
        then: [
          {
            condition: varEqual("mapping.overwrite", false),
            writeTo: {
              path: "attributes.${mapping.hull}",
              format: { operation: "setIfNull", value: "${operateOn}" }
            }
          },
          {
            condition: varEqual("mapping.overwrite", true),
            writeTo: {
              path: "attributes.${mapping.hull}",
              format: { operation: "set", value: "${operateOn}" }
            }
          }
        ]
      }
    },
    {
      operateOn: { component: "input", select: "Id" },
      then: [
        {
          writeTo: {
            path: "ident.anonymous_id",
            format: `\${service_name}-${entityType}:\${operateOn}`
          }
        },
        {
          writeTo: {
            path: `attributes.\${service_name}_${entityType}/id`,
            format: {
              value: "${operateOn}",
              operation: "set"
            }
          }
        }
      ]
    },
    {
      condition: [
        () => entityType === "contact",
        varEqual("connector.private_settings.link_accounts", true)
      ],
      then: [
        {
          operateOn: { component: "input", select: "AccountId" },
          writeTo: {
            path: "accountIdent.anonymous_id",
            format: "${service_name}:${operateOn}"
          }
        },
        {
          operateOn: { component: "input", select: "AccountId" },
          writeTo: { path: "accountAttributes.${service_name}/id" }
        }
      ]
    }
  ];
}

const transformsToService: ServiceTransforms = [
  {
    input: SalesforceContactRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: serviceUserTransformation({ entityType: "contact" })
  },
  {
    input: SalesforceLeadRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: serviceUserTransformation({ entityType: "lead" })
  },
  {
    input: SalesforceAccountRead,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: "${connector.private_settings.account_attributes_inbound}",
        expand: { valueName: "mapping" },
        then: [
          {
            operateOn: {
              component: "input",
              select: "${mapping.service}",
              name: "serviceValue"
            },
            condition: [isNotEqual("serviceValue", undefined)],
            then: [
              {
                condition: isEqual("mapping.overwrite", false),
                writeTo: {
                  path: "attributes.${mapping.hull}",
                  format: { operation: "setIfNull", value: "${operateOn}" }
                }
              },
              {
                condition: isEqual("mapping.overwrite", true),
                writeTo: {
                  path: "attributes.${mapping.hull}",
                  format: { operation: "set", value: "${operateOn}" }
                }
              }
            ]
          }
        ]
      },
      {
        operateOn: "${connector.private_settings.account_claims}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: { component: "input", select: "${mapping.service}" },
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: { path: "ident.${mapping.hull}" }
        }
      },
      {
        operateOn: { component: "input", select: "Id" },
        then: [
          {
            writeTo: {
              path: "ident.anonymous_id",
              format: "${service_name}:${operateOn}"
            }
          },
          {
            writeTo: {
              path: "attributes.${service_name}/id",
              format: { operation: "set", value: "${operateOn}" }
            }
          }
        ]
      },
      {
        operateOn: { component: "input", select: "name" },
        condition: not(varUndefinedOrNull("operateOn")),
        writeTo: {
          path: "attributes.name",
          format: { operation: "setIfNull", value: "${operateOn}" }
        }
      }
    ]
  },
  {
    input: SalesforceTaskRead,
    output: HullIncomingEvent,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      { writeTo: { path: "eventName", value: "${eventName}" } },
      { writeTo: { path: "context.source", value: "${service_name}" } },
      {
        operateOn: { component: "input", select: "CreatedDate" },
        writeTo: {
          path: "context.created_at",
          value: "${operateOn}"
        }
      },
      {
        operateOn: { component: "input", name: "event" },
        writeTo: {
          path: "context.event_id",
          formatter: event => {
            // TODO add source
            return `salesforce-task:${event.Id}`;
          }
        }
      },
      {
        operateOn: "${connector.private_settings.task_attributes_inbound}",
        expand: { valueName: "mapping" },
        then: {
          operateOn: {
            component: "input",
            select: "${mapping.service}",
            name: "serviceValue"
          },
          then: [
            {
              writeTo: {
                path: "properties.${mapping.hull}",
                value: "${operateOn}"
              }
            }
          ]
        }
      }
    ]
  }
];

module.exports = transformsToService;
