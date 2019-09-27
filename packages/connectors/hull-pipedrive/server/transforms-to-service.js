/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullUserRaw, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
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
    input: HullUserRaw,
    output: PipedrivePersonWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "append_index",
    direction: "incoming",
    transforms: [
      {
        mapping: { type: "input" },
        condition: doesNotContain(["hull_service_accountId"], "service_field_name"),
        inputPath: "${service_field_name}",
        outputPath: "${service_field_name}"
      },
      {
        inputPath: "hull_service_accountId",
        outputPath: "org_id"
      },
      {
        inputPath: "${accountId}",
        outputPath: "org_id"
      },
      {
        inputPath: "${first_name}",
        outputPath: "name"
      }
    ]
  }
];

module.exports = transformsToService;
