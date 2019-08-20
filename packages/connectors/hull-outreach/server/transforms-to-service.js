/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: OutreachProspectWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
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
      }
    ]
  },
  {
    input: HullOutgoingAccount,
    output: OutreachAccountWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
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
      }
    ]
  }
];

module.exports = transformsToService;
