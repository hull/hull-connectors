/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

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
              "        \"flattened_segments\" : segments.name,\n" +
              "        \"flattened_account_segments\": account_segments.name\n" +
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
              fields: ["emails", "homePhones", "mobilePhones", "otherPhones", "tags", "voipPhones", "workPhones"],
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            // have to do this mapping for account level fields with prefix "account.X"
            mapping: "connector.private_settings.outgoing_user_attributes",
            outputArrayFields: {
              checkField: "service_field_name",
              fields: ["emails", "homePhones", "mobilePhones", "otherPhones", "tags", "voipPhones", "workPhones"],
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
              fields: ["emails", "homePhones", "mobilePhones", "otherPhones", "tags", "voipPhones", "workPhones"]
            },
            inputPath: "user.${hull_field_name}",
            outputPath: "data.attributes.${service_field_name}",
          },
          {
            arrayStrategy: "json_stringify",
            condition: notNull("connector.private_settings.prospect_outgoing_user_segments"),
            inputPath: "flattened_segments",
            outputPath: "data.attributes.${connector.private_settings.prospect_outgoing_user_segments}",
          },
          {
            arrayStrategy: "json_stringify",
            condition: notNull("connector.private_settings.prospect_outgoing_account_segments"),
            inputPath: "flattened_account_segments",
            outputPath: "data.attributes.${connector.private_settings.prospect_outgoing_account_segments}",
          }
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
              "        \"flattened_account_segments\" : account_segments.name\n" +
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
          }
        ]
      }
    ]
  }
];

module.exports = transformsToService;
