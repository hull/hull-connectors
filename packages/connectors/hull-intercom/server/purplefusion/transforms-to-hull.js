/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import {
  isEqual,
  isNotEqual,
  varUndefinedOrNull,
  not,
  inputIsNotEmpty,
  inputIsEmpty,
  varEqual,
  varInArray,
} from "hull-connector-framework/src/purplefusion/conditionals";

import {
  isUndefinedOrNull
} from "hull-connector-framework/src/purplefusion/utils";

import {
  serviceUserTransforms
} from "hull-connector-framework/src/purplefusion/transform-predefined";

import { HullIncomingAccount, HullIncomingUser, HullConnectorAttributeDefinition } from "hull-connector-framework/src/purplefusion/hull-service-objects";
import { IntercomIncomingCompany, IntercomIncomingUser, IntercomIncomingLead, IntercomAttributeDefinition } from "./service-objects";

const _ = require("lodash");

function contactTransformation({ entityType }) {
  let attributeName = "user";

  if (!isUndefinedOrNull(entityType)) {
    attributeName = entityType;
  }
  return [
    {
      operateOn: `\${connector.private_settings.incoming_${attributeName}_attributes}`,
      expand: { valueName: "mapping" },
      then: [
        {
          condition: [
            inputIsNotEmpty("tags.data"),
            varEqual("mapping.service", "tags"),
          ],
          then: [
            {
              operateOn: { component: "glue", route: "getContactTags", name: "contactTags" },
              writeTo: { path: "attributes.intercom_${service_entity}/tags.operation", value: "set" },
              expand: { valueName: "contactTag" },
              then: [
                {
                  writeTo: {
                    path: "attributes.intercom_${service_entity}/tags.value",
                    appendToArray: "unique",
                    format: "${contactTag.name}"
                  }
                }
              ]
            }
          ]
        },
        {
          condition: [
            inputIsNotEmpty("companies.data"),
            varEqual("mapping.service", "companies"),
          ],
          then: [
            {
              operateOn: { component: "glue", route: "getContactCompanies", name: "contactCompany" },
              writeTo: { path: "attributes.intercom_${service_entity}/companies.operation", value: "set" },
              expand: { valueName: "contactCompany" },
              then: [
                {
                  writeTo: {
                    path: "attributes.intercom_${service_entity}/companies.value",
                    appendToArray: "unique",
                    format: "${contactCompany.name}"
                  }
                }
              ]
            }
          ]
        },
        {
          condition: [
            varEqual("mapping.service", "segments"),
          ],
          then: [
            {
              operateOn: { component: "glue", route: "getContactSegments", name: "contactSegments" },
              then: [
                {
                  condition: varEqual("contactSegments", []),
                  then: [{
                    writeTo: {
                      path: "attributes.intercom_${service_entity}/segments",
                      format: { operation: "set", value: [] }
                    }
                  }]
                },
                {
                  condition: not(varEqual("contactSegments", [])),
                  expand: { valueName: "contactSegment" },
                  writeTo: { path: "attributes.intercom_${service_entity}/segments.operation", value: "set" },
                  then: [
                    {
                      writeTo: {
                        path: "attributes.intercom_${service_entity}/segments.value",
                        appendToArray: "unique",
                        format: "${contactSegment.name}"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          condition: [
            inputIsNotEmpty("social_profiles.data"),
            varEqual("mapping.service", "social_profiles"),
          ],
          then: [
            {
              operateOn: { component: "input", select: "${mapping.service}.data", name: "profiles" },
              expand: { valueName: "profile" },
              then: {
                writeTo: {
                  path: "attributes.intercom_${service_entity}/${profile.name}_url",
                  format: { operation: "set", value: "${profile.url}" },
                  pathFormatter: (path) => path.toLowerCase()
                },
                then: {
                  writeTo: { path: "attributes.intercom_${service_entity}/social_profiles.operation", value: "set" },
                  then: {
                    writeTo: {
                      path: "attributes.intercom_${service_entity}/social_profiles.value",
                      appendToArray: "unique",
                      format: "${profile.url}"
                    }
                  }
                }
              }
            },
          ]
        },
        {
          condition: [inputIsEmpty("tags.data"), varEqual("mapping.service", "tags")],
          then: [{
            writeTo: {
              path: "attributes.intercom_${service_entity}/tags",
              format: { operation: "set", value: [] }
            }
          }]
        },
        {
          condition: [inputIsEmpty("companies.data"), varEqual("mapping.service", "companies")],
          then: [{
            writeTo: {
              path: "attributes.intercom_${service_entity}/companies",
              format: { operation: "set", value: [] }
            }
          }]
        },
        {
          condition: [inputIsEmpty("social_profiles.data"), varEqual("mapping.service", "social_profiles")],
          then: [{
            writeTo: {
              path: "attributes.intercom_${service_entity}/social_profiles",
              format: { operation: "set", value: [] }
            }
          }]
        }
      ]
    }
  ];
}

const transformsToService: ServiceTransforms = [
  {
    input: IntercomAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      `$.{ "type": data_type, "name": full_name, "display": label, "readOnly": $not(api_writable) }`
    ]
  },
  {
    input: IntercomIncomingUser,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      serviceUserTransforms({ entityType: "user", attributeExclusions: ["tags", "companies", "segments", "social_profiles"] }),
      contactTransformation({ entityType: "user" })
    )
  },
  {
    input: IntercomIncomingLead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: _.concat(
      serviceUserTransforms({ entityType: "lead", attributeExclusions: ["tags", "companies", "segments", "social_profiles"] }),
      contactTransformation({ entityType: "lead" })
    )
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
            condition: [
              not(varInArray("mapping.service", ["tags", "segments"])),
              isNotEqual("serviceValue", undefined)
            ],
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
            operateOn: { component: "input", select: "tags.tags", name: "companyTags" },
            writeTo: { path: "attributes.intercom/tags.operation", value: "set" } ,
            expand: { valueName: "companyTag" },
            condition: [
              isEqual("mapping.service", "tags"),
              not(varEqual("companyTags", []))
            ],
            then: [
              {
                writeTo: {
                  path: "attributes.intercom/tags.value",
                  appendToArray: "unique",
                  format: "${companyTag.name}",
                }
              }
            ]
          },
          {
            operateOn: { component: "input", select: "tags.tags", name: "companyTags" },
            writeTo: { path: "attributes.intercom/tags.operation", value: "set" } ,
            condition: [
              isEqual("mapping.service", "tags"),
              varEqual("companyTags", [])
            ],
            then: [
              { writeTo: { path: "attributes.intercom/tags", format: { "operation": "set", "value": [] } } }
            ]
          },
          {
            condition: [
              varEqual("mapping.service", "segments"),
            ],
            then: [
              {
                operateOn: { component: "glue", route: "getCompanySegments", name: "companySegments" },
                then: [
                  {
                    condition: varEqual("companySegments", []),
                    then: [{ writeTo: { path: "attributes.intercom/segments", format: { operation: "set", value: [] } } }]
                  },
                  {
                    condition: not(varEqual("contactSegments", [])),
                    expand: { valueName: "companySegment" },
                    writeTo: { path: "attributes.intercom/segments.operation", value: "set" } ,
                    then: [
                      {
                        writeTo: {
                          path: "attributes.intercom/segments.value",
                          appendToArray: "unique",
                          format: "${companySegment.name}"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
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
