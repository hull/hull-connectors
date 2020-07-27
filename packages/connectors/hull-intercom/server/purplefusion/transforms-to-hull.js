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
  varInArray
} from "hull-connector-framework/src/purplefusion/conditionals";

import { HullIncomingAccount, HullIncomingUser } from "hull-connector-framework/src/purplefusion/hull-service-objects";
import { IntercomIncomingCompany, IntercomIncomingUser, IntercomIncomingLead } from "./service-objects";


const contactTransformation = [
  {
    operateOn: "${contactAttributeMapping}",
    expand: { valueName: "mapping" },
    then: [
      {
        operateOn: { component: "input", select: "custom_attributes.${mapping.name}", name: "serviceValue"},
        condition: isNotEqual("serviceValue", undefined),
        then: [
          {
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "${attributeOperation}", value: "${operateOn}" } }
          }
        ]
      },
      {
        operateOn: { component: "input", select: "${mapping.name}", name: "serviceValue"},
        condition: [
          isNotEqual("serviceValue", undefined),
          not(varInArray("mapping.name", ["tags", "companies", "segments", "social_profiles"]))
        ],
        then: [
          {
            writeTo: { path: "attributes.${mapping.hull}", format: { operation: "${attributeOperation}", value: "${operateOn}" } }
          }
        ]
      },
      {
        condition: [
          inputIsNotEmpty("tags.data"),
          varEqual("mapping.name", "tags"),
        ],
        then: [
          {
            operateOn: { component: "glue", route: "getContactTags", name: "contactTags" },
            writeTo: { path: "attributes.intercom/tags.operation", value: "${attributeOperation}" } ,
            expand: { valueName: "contactTag" },
            then: [
              {
                writeTo: {
                  path: "attributes.intercom/tags.value",
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
          varEqual("mapping.name", "companies"),
        ],
        then: [
          {
            operateOn: { component: "glue", route: "getContactCompanies", name: "contactCompany" },
            writeTo: { path: "attributes.intercom/companies.operation", value: "${attributeOperation}" } ,
            expand: { valueName: "contactCompany" },
            then: [
              {
                writeTo: {
                  path: "attributes.intercom/companies.value",
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
          varEqual("mapping.name", "segments"),
        ],
        then: [
          {
            operateOn: { component: "glue", route: "getContactSegments", name: "contactSegments" },
            then: [
              {
                condition: varEqual("contactSegments", []),
                then: [{ writeTo: { path: "attributes.intercom/segments", format: { operation: "${attributeOperation}", value: [] } } }]
              },
              {
                condition: not(varEqual("contactSegments", [])),
                expand: { valueName: "contactSegment" },
                writeTo: { path: "attributes.intercom/segments.operation", value: "${attributeOperation}" } ,
                then: [
                  {
                    writeTo: {
                      path: "attributes.intercom/segments.value",
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
          varEqual("mapping.name", "social_profiles"),
        ],
        then: [
          {
            operateOn: { component: "input", select: "${mapping.name}.data", name: "profiles"},
            expand: { valueName: "profile" },
            then: {
              writeTo: {
                path: "attributes.intercom/${profile.name}_url",
                format: { operation: "${attributeOperation}", value: "${profile.url}" },
                pathFormatter: (path) => path.toLowerCase()
              },
              then: {
                writeTo: { path: "attributes.intercom/social_profiles.operation", value: "${attributeOperation}" } ,
                then: {
                  writeTo: {
                    path: "attributes.intercom/social_profiles.value",
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
        condition: [inputIsEmpty("tags.data"), varEqual("mapping.name", "tags"),],
        then: [{ writeTo: { path: "attributes.intercom/tags", format: { operation: "${attributeOperation}", value: [] } } }]
      },
      {
        condition: [inputIsEmpty("companies.data"), varEqual("mapping.name", "companies"),],
        then: [{ writeTo: { path: "attributes.intercom/companies", format: { operation: "${attributeOperation}", value: [] } } }]
      },
      {
        condition: [inputIsEmpty("social_profiles.data"), varEqual("mapping.name", "social_profiles"),],
        then: [{ writeTo: { path: "attributes.intercom/social_profiles", format: { operation: "${attributeOperation}", value: [] } } }]
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
      { writeTo: { path: "attributes.${service_name}/id", format: { operation: "setIfNull", value: "${operateOn}" } } }
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