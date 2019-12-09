/* @flow */
import type { Transform, ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const { isNull, notNull, isEqual, doesNotContain } = require("hull-connector-framework/src/purplefusion/conditionals");

const { HullOutgoingUser, HullOutgoingAccount } = require("hull-connector-framework/src/purplefusion/hull-service-objects");
const { ZapierUserWrite } = require("./service-objects");

const transformsToService: ServiceTransforms = [
  /*{
    input: HullOutgoingUser,
    output: ZapierUserWrite,
    strategy: "PropertyKeyedValue",
    arrayStrategy: "send_raw_array",
    direction: "outgoing",
    transforms: []
  }*/
];

module.exports = transformsToService;
