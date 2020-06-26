/* @flow */

import type { ServiceTransforms } from "hull-connector-framework/src/purplefusion/types";
import { HubspotWebhookPayload } from "./service-objects";
import { isEqual, isNotEqual } from "hull-connector-framework/src/purplefusion/conditionals";

const {
  HullIncomingUser,
  HullIncomingAccount
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const transformsToService: ServiceTransforms = [];

module.exports = transformsToService;
