/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

import {
  HullOutgoingUser,
  HullOutgoingAccount
} from "hull-connector-framework/src/purplefusion/hull-service-objects";

import {
  FreshsuccessAccountWrite,
  FreshsuccessContactWrite
} from "./service-objects";


import {
  varUndefinedOrNull,
  not,
  varInResolvedArray,
  varInArray,
  varEqual
} from "hull-connector-framework/src/purplefusion/conditionals";

const _ = require("lodash");

function dimensionTransformation({ hullType, attributeGroup }) {
  return [
    {
      operateOn: `\${outgoing_${attributeGroup}}`,
      expand: { valueName: "mapping" },
      then: [
        {
          operateOn: { component: "input", select: `${hullType}.\${mapping.hull}`, name: "serviceValue" },
          condition: not(varUndefinedOrNull("serviceValue")),
          writeTo: {
            appendToArray: "unique",
            path: attributeGroup,
            format: {
              key: "${mapping.service}",
              value: "${serviceValue}"
            }
          }
        },
        {
          operateOn: { component: "input", select: "${mapping.hull}", name: "serviceValue" },
          condition: not(varUndefinedOrNull("serviceValue")),
          writeTo: {
            appendToArray: "unique",
            path: attributeGroup,
            format: {
              key: "${mapping.service}",
              value: "${serviceValue}"
            }
          }
        }
      ]
    }
  ];
}

const rawArrayAttributes = [
  "documents",
  "stage_history",
  "nps_history"
];

function outgoingTransformation({ hullType }) {
  return [
    {
      operateOn: `\${connector.private_settings.outgoing_${hullType}_attributes}`,
      expand: { valueName: "mapping" },
      then: [
        {
          condition: [
            varInResolvedArray("mapping.service", rawArrayAttributes)
          ],
          then: [
            {
              operateOn: { component: "input", select: `${hullType}.\${mapping.hull}` },
              writeTo: {
                appendToArray: "unique",
                path: "${mapping.service}",
                formatter: (value) => {
                  return value;
                }
              }
            },
            {
              operateOn: { component: "input", select: "${mapping.hull}" },
              writeTo: {
                appendToArray: "unique",
                path: "${mapping.service}",
                formatter: (value) => {
                  return value;
                }
              }
            }
          ]
        },
        {
          condition: [
            not(varEqual("mapping.service", "assigned_csms")),
            not(varInResolvedArray("mapping.service", "${custom_attributes}")),
            not(varInArray("mapping.service", rawArrayAttributes))
          ],
          then: [
            {
              operateOn: { component: "input", select:`${hullType}.\${mapping.hull}` },
              writeTo: { path: "${mapping.service}" }
            },
            {
              operateOn: { component: "input", select: "${mapping.hull}" },
              writeTo: { path: "${mapping.service}" }
            }
          ]
        },
        {
          condition: varEqual("mapping.service", "assigned_csms"),
          then: [
            {
              operateOn: { component: "input", select:`${hullType}.\${mapping.hull}`, name: "serviceValue" },
              condition: [
                not(varUndefinedOrNull("serviceValue"))
              ],
              then: {
                writeTo: {
                  path: "assigned_csms",
                  formatter: (emails) => {
                    const emailArray = _.isArray(emails) ? emails : [emails];
                    return _.map(_.uniq(emailArray), email => {
                      return { email }
                    });
                  }
                }
              }
            }
          ]
        }
      ]
    },
    {
      operateOn: `\${connector.private_settings.${hullType}_claims}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: `${hullType}.\${mapping.hull}` },
        condition: not(varUndefinedOrNull("operateOn")),
        writeTo: {
          path: "${mapping.service}"
        }
      }
    }
  ];
}

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: FreshsuccessContactWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      dimensionTransformation({ hullType: "user", attributeGroup: "custom_label_dimensions" }),
      dimensionTransformation({ hullType: "user", attributeGroup: "custom_value_dimensions" }),
      dimensionTransformation({ hullType: "user", attributeGroup: "custom_event_dimensions" }),
      outgoingTransformation({ hullType: "user" })
    )
  },
  {
    input: HullOutgoingAccount,
    output: FreshsuccessAccountWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      dimensionTransformation({ hullType: "account", attributeGroup: "custom_label_dimensions" }),
      dimensionTransformation({ hullType: "account", attributeGroup: "custom_value_dimensions" }),
      dimensionTransformation({ hullType: "account", attributeGroup: "custom_event_dimensions" }),
      outgoingTransformation({ hullType: "account" })
    )
  }
];

module.exports = transformsToService;
