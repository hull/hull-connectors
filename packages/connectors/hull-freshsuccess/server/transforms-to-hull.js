/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import {
  isEqual,
  isNotEqual,
  varUndefinedOrNull,
  not,
  inputIsNotEmpty,
  inputIsEmpty,
  varEqual,
  varInArray,
  inputIsEqual,
  varSizeEquals
} from "hull-connector-framework/src/purplefusion/conditionals";

import {
  HullIncomingAccount,
  HullIncomingUser,
  HullConnectorAttributeDefinition
} from "hull-connector-framework/src/purplefusion/hull-service-objects";
import {
  FreshsuccessAccountRead,
  FreshsuccessContactRead,
  FreshsuccessIncomingAttributeDefinition,
  FreshsuccessOutgoingAttributeDefinition
} from "./service-objects";

const _ = require("lodash");

const transformsToService: ServiceTransforms = [
  {
    input: FreshsuccessIncomingAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      `$.{ "type": data_type, "name": full_name, "display": label, "readOnly": $not(api_writable) }`
    ]
  },
  {
    input: FreshsuccessOutgoingAttributeDefinition,
    output: HullConnectorAttributeDefinition,
    strategy: "Jsonata",
    direction: "incoming",
    batchTransform: true,
    transforms: [
      `$.{ "type": data_type, "name": name, "display": label, "readOnly": $not(api_writable) }`
    ]
  },
  {
    input: FreshsuccessContactRead,
    output: HullIncomingUser,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: []
  },
  {
    input: FreshsuccessAccountRead,
    output: HullIncomingAccount,
    direction: "incoming",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then: []
  }
];

module.exports = transformsToService;
