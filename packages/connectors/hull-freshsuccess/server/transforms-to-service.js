/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";

import {
  HullOutgoingUser,
  HullOutgoingAccount
} from "hull-connector-framework/src/purplefusion/hull-service-objects";

import {
  FreshsuccessAccountWrite,
  FreshsuccessContactWrite
} from "./service-objects";

import {
  varUndefinedOrNull,
  not,
  varInResolvedArray,
  isNotEqual
} from "hull-connector-framework/src/purplefusion/conditionals";

const _ = require("lodash");

const transformsToService: ServiceTransforms = [
  {
    input: HullOutgoingUser,
    output: FreshsuccessContactWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then:[]
  },
  {
    input: HullOutgoingAccount,
    output: FreshsuccessAccountWrite,
    direction: "outgoing",
    strategy: "AtomicReaction",
    target: { component: "new" },
    then:[]
  }
];

module.exports = transformsToService;
