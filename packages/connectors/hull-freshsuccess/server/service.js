/* @flow */
import type {
  RawRestApi
} from "hull-connector-framework/src/purplefusion/types";
import {
  FreshsuccessAccountReads,
  FreshsuccessAccountRead,
  FreshsuccessAccountWrites,
  FreshsuccessContactReads,
  FreshsuccessContactRead,
  FreshsuccessContactWrites
} from "./service-objects";

const _ = require("lodash");
const MESSAGES = require("./messages");
const {
  ConfigurationError,
  RateLimitError,
  SkippableError,
  TransientError
} = require("hull/src/errors");

const {
  isNull,
  notNull
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");

const service = (): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://${api_host}/api/v2",
  defaultReturnObj: "body",
  endpoints: {
    getAllContacts: {
      url: "/account_contacts",
      operation: "get",
      output: FreshsuccessContactReads,
      query: {
        "include_inactive": false, // TODO make configurable
        "page": "${offset_page}",
        "include_dimensions": true
      }
    },
    getAllAccounts: {
      url: "/accounts",
      operation: "get",
      output: FreshsuccessAccountReads,
      query: {
        "include_inactive": false, // TODO make configurable
        "direction": "desc",
        "order_by": "join_date",
        "page": "${offset_page}",

        // TODO "To return all properties by default, including dimensions, stage history and nps history, get a single account"
        "include": "custom_value_dimensions, custom_label_dimensions, custom_event_dimension, assigned_csms"
      }
    },
    bulkUpsertAccounts: {
      url: "/accounts",
      operation: "post",
      endpointType: "update",
      returnObj: "body",
      input: FreshsuccessAccountWrites,
      output: FreshsuccessAccountReads
    },
    bulkUpsertContacts: {
      url: "/account_contacts",
      operation: "post",
      endpointType: "update",
      returnObj: "body",
      input: FreshsuccessContactWrites,
      output: FreshsuccessContactReads
    },
  },
  superagent: {
    settings: [
      { method: "set", params: { "Accept": "application/json" }},
      { method: "set", params: { "Content-Type": "application/json" }},
    ]
  },
  error: {
    parser: {
      httpStatus: "status",
      parser: {
        type: "json",
        target: "response.text",
        title: "errors[0].code",
        description: "errors[0].message"
      }
    },
    templates: [
      // TODO error handling (bulk upserts)
    ]
  }
});

module.exports = service;
