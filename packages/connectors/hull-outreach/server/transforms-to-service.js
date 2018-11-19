/* @flow */
import type { Transform, ServiceTransforms } from "./shared/types";

const { HullOutgoingUser, HullOutgoingAccount } = require("./shared/hull-service-objects");
const { OutreachProspectWrite, OutreachAccountWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: OutreachProspectWrite,
    strategy: "PropertyKeyedValue",
    transforms: [
      { outputPath: "data.type", outputFormat: "prospect" },
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
        mapping: "connector.private_settings.prospect_attributes_outbound",
        inputPath: "${input_field_name}",
        outputPath: "data.attributes.${output_field_name}",
      }
    ]
  },
  {
    input: HullOutgoingAccount,
    output: OutreachAccountWrite,
    strategy: "PropertyKeyedValue",
    transforms: [
      { outputPath: "data.type", outputFormat: "account" },
      { inputPath: "outreach/id", outputPath: "data.id" },
      { inputPath: "domain", outputPath: "data.attributes.domain" },
      {
        mapping: "connector.private_settings.account_attributes_outbound",
        inputPath: "${input_field_name}",
        outputPath: "data.attributes.${output_field_name}",
      }
    ]
  }
];

module.exports = {
  transformsToService
};
