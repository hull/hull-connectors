/* @flow */
import type { Transform, ServiceTransforms } from "./shared/types";

const { HullOutgoingUser, HullOutgoingAccount } = require("./shared/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: OutreachProspectWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "outgoing",
    transforms: [
      { outputPath: "data.type", outputFormat: "prospect" },
      { outputPath: "data.id", outputFormat: "${userId}" },
      { inputPath: "outreach/id", outputPath: "data.id" },
      { inputPath: "email", outputPath: "data.attributes.emails", outputFormat: ["${value}"] },
      {
        inputPath: "account.outreach/id",
        outputPath: "data.relationships.account.data",
        outputFormat: {
          type: "account",
          id: "${value}"
        }
      },
      {
        mapping: "connector.private_settings.outgoing_user_attributes",
        inputPath: "${hull_field_name}",
        outputPath: "data.attributes.${service_field_name}",
      }
    ]
  },
  {
    input: HullOutgoingAccount,
    output: OutreachAccountWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "outgoing",
    transforms: [
      { outputPath: "data.type", outputFormat: "account" },
      { outputPath: "data.id", outputFormat: "${accountId}" },
      { inputPath: "outreach/id", outputPath: "data.id" },
      // won't be set if it does not exist, will only exist on insert
      // if we set something different for name in mapping, then it will get overridden
      // which is good
      { outputPath: "data.attributes.name", outputFormat: "${hull_domain}" },
      { inputPath: "domain", outputPath: "data.attributes.domain" },
      {
        mapping: "connector.private_settings.outgoing_account_attributes",
        inputPath: "${hull_field_name}",
        outputPath: "data.attributes.${service_field_name}",
      }
    ]
  }
];

module.exports = {
  transformsToService
};
