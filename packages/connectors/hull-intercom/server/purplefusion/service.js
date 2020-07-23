/* @flow */
import type {
  RawRestApi,
  EndpointType,
  RequestType
} from "hull-connector-framework/src/purplefusion/types";
import { IntercomIncomingCompany } from "./service-objects";

const _ = require("lodash");
const MESSAGES = require("./messages");
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

const service: RawRestApi = {
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://api.intercom.io",
  defaultReturnObj: "body",
  endpoints: {
    getRecentCompanies: {
      url: "/companies",
      operation: "get",
      output: IntercomIncomingCompany,
      query: {
        "page": "${pageOffset}",
        "per_page": "${pageSize}",
        "order": "desc"
      }
    },
    getAllCompaniesScroll: {
      url: "/companies/scroll",
      operation: "get",
      output: IntercomIncomingCompany,
      query: {
        "scroll_param": "${offset}"
      }
    },
  },
  superagent: {
    settings: [
      { method: "set", params: { "Intercom-Version": "${intercomApiVersion}" }},
      { method: "set", params: { "Accept": "application/json" }},
      {
        method: "set",
        params: {
          Authorization: "Bearer ${connector.private_settings.access_token}"
        }
      }
    ]
  },
  authentication: {},
  error: {}
};

module.exports = service;
