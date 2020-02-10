/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesContain, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const outreachProspectArrayFields = ["emails", "homePhones", "mobilePhones", "otherPhones", "tags", "voipPhones", "workPhones"];
const outreachAccountArrayFields = ["tags"];

// For sending an array via stringify, and excluding if attribute name is in blacklist
const createStringifyTransform = (inputField, outgoingAttributeNameField, arrayFields) => {
  return {
    arrayStrategy: "json_stringify",
    condition: [
      notNull(outgoingAttributeNameField),
      doesNotContain(arrayFields, outgoingAttributeNameField)
    ],
    inputPath: inputField,
    outputPath: `data.attributes.\${${outgoingAttributeNameField}}`,
  }
};

// For sending an array via raw array, and including if attribute name is in whitelist
const createRawArrayTransform = (inputField, outgoingAttributeNameField, arrayFields) => {
  return {
    arrayStrategy: "send_raw_array",
    condition: [
      notNull(outgoingAttributeNameField),
      doesContain(arrayFields, outgoingAttributeNameField)
    ],
    inputPath: inputField,
    outputPath: `data.attributes.\${${outgoingAttributeNameField}}`,
  }
};

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: OutreachProspectWrite,
    strategy: "MixedTransforms",
    direction: "outgoing",
    transforms:[
      {
        strategy: "Jsonata",
        direction: "outgoing",
        transforms: [
          {
            expression: "$merge([\n" +
              "    $spread(),\n" +
              "    {\n" +
              "        \"flattened_segments\" : [segments.name],\n" +
              "        \"flattened_account_segments\": [account_segments.name]\n" +
              "    }\n" +
              "])"
          }
        ]
      },
      {
        strategy: "PropertyKeyedValue",
        arrayStrategy: "send_raw_array",
        transforms: [
          { outputPath: "data.type", outputFormat: "prospect" },
          { inputPath: "user.outreach/id", outputPath: "data.id" },
          { outputPath: "data.id", outputFormat: "${userId}" },
          {
            condition: "accountId",
            outputPath: "data.relationships.account.data",
            outputFormat: {
              type: "account",
              id: "${accountId}"
            }
          },
          {
            mapping: "connector.private_settings.outgoing_user_attributes",
            condition: doesNotContain(["stage", "owner"], "service_field_name"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: outreachProspectArrayFields
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            // have to do this mapping for account level fields with prefix "account.X"
            mapping: "connector.private_settings.outgoing_user_attributes",
            outputArrayFields: {
              checkField: "service_field_name",
              fields: outreachProspectArrayFields
            },
            inputPath: "${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            mapping: "connector.private_settings.outgoing_user_attributes",
            condition: isEqual("service_field_name", "stage"),
            inputPath: "user.${hull_field_name}",
            outputPath: "data.relationships.stage.data",
            outputFormat: {
              type: "stage",
              id: "${value}"
            }
          },
          {
            mapping: "connector.private_settings.outgoing_user_attributes",
            condition: isEqual("service_field_name", "owner"),
            inputPath: "user.${hull_field_name}",
            outputPath: "data.relationships.owner.data",
            outputFormat: {
              type: "user",
              id: "${value}"
            }
          },
          {
            mapping: "connector.private_settings.user_claims",
            condition: notNull("existingProspect"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["emails", "homePhones", "mobilePhones", "otherPhones", "tags", "voipPhones", "workPhones"],
              mergeArrayFromContext: "existingProspect.attributes.${service_field_name}"
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            mapping: "connector.private_settings.user_claims",
            condition: isNull("userId"),
            outputArrayFields: {
              checkField: "service_field_name",
              fields: outreachProspectArrayFields
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          createStringifyTransform("flattened_segments", "connector.private_settings.prospect_outgoing_user_segments", outreachProspectArrayFields),
          createStringifyTransform("flattened_account_segments", "connector.private_settings.prospect_outgoing_account_segments", outreachProspectArrayFields),
          createRawArrayTransform("flattened_segments", "connector.private_settings.prospect_outgoing_user_segments", outreachProspectArrayFields),
          createRawArrayTransform("flattened_account_segments", "connector.private_settings.prospect_outgoing_account_segments", outreachProspectArrayFields)
        ]
      },
    ],
  },
  {
    input: HullOutgoingAccount,
    output: OutreachAccountWrite,
    strategy: "MixedTransforms",
    direction: "outgoing",
    transforms:[
      {
        strategy: "Jsonata",
        direction: "outgoing",
        transforms: [
          {
            expression: "$merge([\n" +
              "    $spread(),\n" +
              "    {\n" +
              "        \"flattened_account_segments\" : [account_segments.name]\n" +
              "    }\n" +
              "])"
          }
        ]
      },
      {
        strategy: "PropertyKeyedValue",
        arrayStrategy: "send_raw_array",
        transforms: [
          { outputPath: "data.type", outputFormat: "account" },
          { inputPath: "account.outreach/id", outputPath: "data.id" },
          { outputPath: "data.id", outputFormat: "${accountId}" },
          //still need to take this out in favor of setting the settings outgoing mappings
          { inputPath: "account.domain", outputPath: "data.attributes.domain" },
          {
            mapping: "connector.private_settings.outgoing_account_attributes",
            inputPath: "account.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            mapping: "connector.private_settings.account_claims",
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["tags"],
              mergeArrayFromContext: "existingAccount.attributes.${service_field_name}"
            },
            inputPath: "account.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            arrayStrategy: "json_stringify",
            condition: notNull("connector.private_settings.outgoing_account_segments"),
            inputPath: "flattened_account_segments",
            outputPath: "data.attributes.${connector.private_settings.outgoing_account_segments}",
          },
          createStringifyTransform("flattened_account_segments", "connector.private_settings.outgoing_account_segments", outreachAccountArrayFields),
          createRawArrayTransform("flattened_account_segments", "connector.private_settings.outgoing_account_segments", outreachAccountArrayFields)
        ]
      }
    ]
  }
];

module.exports = transformsToService;
