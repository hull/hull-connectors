/* @flow */
import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

const {
  inputIsNotEmpty
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  HullIncomingUser,
  HullIncomingAccount
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  ZapierUserRead,
  ZapierAccountRead
} = require("./service-objects");

const transformsToHull: ServiceTransforms = [
  // TODO implement new transformation stuff when it's ready
];

module.exports = transformsToHull;
