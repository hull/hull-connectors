/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { PipedriveOrgWrite, PipedrivePersonWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingAccount,
    output: PipedriveOrgWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: [
      {
        mapping: "connector.private_settings.outgoing_account_attributes",
        inputPath: "account.${hull_field_name}",
        outputPath: "${service_field_name}",
      }
    ]
  },
  {
    input: HullOutgoingUser,
    output: PipedrivePersonWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: [
      { inputPath: "user.name",
        outputPath: "name" },
      {
        mapping: "connector.private_settings.user_claims",
        outputArrayFields: {
          checkField: "service_field_name",
          fields: ["email"]
        },
        inputPath: "user.${hull_field_name}",
        outputPath: "${service_field_name}",
      },
      {
        mapping: "connector.private_settings.outgoing_user_attributes",
        condition: doesNotContain(["hull_service_accountId"], "service_field_name"),
        outputArrayFields: {
          checkField: "service_field_name",
          fields: ["email"]
        },
        inputPath: "user.${service_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        inputPath: "hull_service_accountId",
        outputPath: "org_id"
      },
      {
        inputPath: "${accountId}",
        outputPath: "org_id"
      }
    ]
  }
];

module.exports = transformsToService;
