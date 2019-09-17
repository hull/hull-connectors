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
  }
];

module.exports = transformsToService;
