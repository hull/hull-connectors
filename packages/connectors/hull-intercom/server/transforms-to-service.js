/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

import {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullOutgoingEvent,
  HullApiAttributeDefinition
} from "hull-connector-framework/src/purplefusion/hull-service-objects";

import {
  IntercomCompanyWrite,
  IntercomUserWrite,
  IntercomLeadWrite,
  IntercomEventWrite,
  IntercomAttributeWrite
} from "./service-objects";

import {
  varUndefinedOrNull,
  not,
  varInResolvedArray,
  isNotEqual
} from "hull-connector-framework/src/purplefusion/conditionals";

const _ = require("lodash");

const jsonifyArrays = obj => {
  _.forEach(_.keys(obj), key => {
    const value = obj[key];
    if (Array.isArray(value)) {
      obj[key] = JSON.stringify(obj[key]);
    } else if (_.isPlainObject(obj[key])) {
      return jsonifyArrays(obj[key]);
    }
    return obj[key];
  });
  return obj;
};

function outgoingTransformation({ hullType, serviceType }) {
  return [
    {
      operateOn: `\${connector.private_settings.outgoing_${serviceType}_attributes}`,
      expand: { valueName: "mapping" },
      then: [
        {
          condition: [
            varInResolvedArray("mapping.service", "${custom_attributes}")
          ],
          then: [
            {
              operateOn: { component: "input", select: `${hullType}.\${mapping.hull}` },
              writeTo: {
                path: "custom_attributes.${mapping.service}",
                formatter: (value) => {
                  if (Array.isArray(value)) {
                    return JSON.stringify(value);
                  } else if (_.isPlainObject(value)) {
                    return jsonifyArrays(value);
                  }
                  return value;
                }
              }
            },
            {
              operateOn: { component: "input", select: "${mapping.hull}" },
              writeTo: {
                path: "custom_attributes.${mapping.service}",
                formatter: (value) => {
                  if (Array.isArray(value)) {
                    return JSON.stringify(value);
                  } else if (_.isPlainObject(value)) {
                    return jsonifyArrays(value);
                  }
                  return value;
                }
              }
            }
          ]
        },
        {
          condition: [
            not(varInResolvedArray("mapping.service", "${custom_attributes}"))
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
        }
      ]
    },
    {
      operateOn: `\${connector.private_settings.${serviceType}_claims}`,
      expand: { valueName: "mapping" },
      then: {
        operateOn: { component: "input", select: `${hullType}.\${mapping.hull}` },
        condition: not(varUndefinedOrNull("operateOn")),
        writeTo: {
          path: "${mapping.service}"
        }
      }
    },
    {
      condition: [
        isNotEqual("service_type", "company"),
      ],
      then: [
        {
          writeTo: {
            path: "role",
            value: serviceType
          }
        }
      ]
    }
  ];

}

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingAccount,
    output: IntercomCompanyWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: outgoingTransformation({ hullType: "account", serviceType: "account" })
  },
  {
    input: HullOutgoingUser,
    output: IntercomUserWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: outgoingTransformation({ hullType: "user", serviceType: "user" })
  },
  {
    input: HullOutgoingUser,
    output: IntercomLeadWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: outgoingTransformation({ hullType: "user", serviceType: "lead" })
  },
  {
    input: HullOutgoingEvent,
    output: IntercomEventWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      {
        operateOn: { component: "input", select: "event" },
        then: {
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: {
            path: "event_name"
          }
        }
      },
      {
        operateOn: { component: "input", select: "properties.created" },
        then: {
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: {
            path: "created_at"
          }
        }
      },
      { writeTo: { path: "id", value: "${contactId}" } },
      {
        operateOn: { component: "input", select: "properties" },
        expand: { keyName: "property", valueName: "propertyValue" },
        then: {
          condition: not(varUndefinedOrNull("operateOn")),
          writeTo: {
            path: "metadata.${property}",
            formatter: (value) => {
              if (Array.isArray(value)) {
                return JSON.stringify(value);
              } else if (_.isPlainObject(value)) {
                return jsonifyArrays(value);
              }
              return value;
            }
          }
        }
      }
    ]
  },
  {
    input: HullApiAttributeDefinition,
    output: IntercomAttributeWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: [
      { writeTo: { path: "model", value: "${service_model}" } },
      { writeTo: { path: "data_type", value: "string" } },
      {
        operateOn: { component: "input", select: "service" },
        writeTo: { path: "name" }
      }
    ]
  }
];

module.exports = transformsToService;
