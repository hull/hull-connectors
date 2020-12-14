/* @flow */
import type {
  RawRestApi,
  EndpointType,
  RequestType
} from "hull-connector-framework/src/purplefusion/types";

const _ = require("lodash");
const {
  ConfigurationError,
  RateLimitError,
  SkippableError
} = require("hull/src/errors");

const {} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  isNull,
  notNull
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");

const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullUserRaw,
  HullIncomingAccount,
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const service: RawRestApi = {
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "",
  defaultReturnObj: "body",
  endpoints: {},
  superagent: {},
  authentication: {},
  error: {}
};

module.exports = service;
