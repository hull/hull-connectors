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
  SkippableError,
  TransientError
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
    getContacts: {
      url: "/contacts/search",
      operation: "post"
    },
    getContactTags: {
      url: "/contacts/${contactId}/tags",
      operation: "get",
      returnObj: "body.data",
    },
    getContactCompanies: {
      url: "/contacts/${contactId}/companies",
      operation: "get",
      returnObj: "body.data",
    },
    getContactSegments: {
      url: "/contacts/${contactId}/segments",
      operation: "get",
      returnObj: "body.data",
    },
    getCompanySegments: {
      url: "/companies/${companyId}/segments",
      operation: "get",
      returnObj: "body.data",
    }
  },
  superagent: {
    settings: [
      { method: "set", params: { "Intercom-Version": "${intercomApiVersion}" }},
      { method: "set", params: { "Accept": "application/json" }},
      { method: "set", params: { "Content-Type": "application/json" }},
      {
        method: "set",
        params: {
          Authorization: "Bearer ${connector.private_settings.access_token}"
        }
      }
    ]
  },
  authentication: {},
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
      {
        truthy: { status: 400 },
        errorType: TransientError,
        message: MESSAGES.BAD_REQUEST
      },
      {
        truthy: { status: 401 },
        condition: isNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND
      },
      {
        truthy: { status: 401 },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.INVALID_ACCESS_TOKEN
      },
      {
        truthy: { status: 402 },
        errorType: SkippableError,
        message: MESSAGES.PAYMENT_REQUIRED
      },
      {
        truthy: { status: 403 },
        errorType: SkippableError,
        message: MESSAGES.FORBIDDEN
      },
      {
        truthy: { status: 404 },
        errorType: SkippableError,
        message: MESSAGES.NOT_FOUND
      },
      {
        truthy: { status: 405 },
        errorType: SkippableError,
        message: MESSAGES.METHOD_NOT_ALLOWED
      },
      {
        truthy: { status: 406 },
        errorType: SkippableError,
        message: MESSAGES.NOT_ACCEPTABLE
      },
      {
        truthy: { status: 408 },
        errorType: TransientError,
        message: MESSAGES.REQUEST_TIMEOUT,
        retryAttempts: 2
      },
      {
        truthy: { status: 409 },
        errorType: SkippableError,
        message: MESSAGES.CONFLICT
      },
      {
        truthy: { status: 415 },
        errorType: SkippableError,
        message: MESSAGES.UNSUPPORTED_MEDIA_TYPE
      },
      {
        truthy: { status: 422 },
        errorType: SkippableError,
        message: MESSAGES.UNPROCESSABLE_ENTITY
      },
      {
        truthy: { status: 429 },
        errorType: RateLimitError,
        message: MESSAGES.TOO_MANY_REQUESTS
      },
      {
        truthy: { status: 500 },
        errorType: TransientError,
        message: MESSAGES.INTERCOM_INTERNAL_SERVER_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 502 },
        errorType: TransientError,
        message: MESSAGES.INTERCOM_INTERNAL_SERVER_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 503 },
        errorType: TransientError,
        message: MESSAGES.INTERCOM_INTERNAL_SERVER_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 504 },
        errorType: TransientError,
        message: MESSAGES.INTERCOM_INTERNAL_SERVER_ERROR,
        retryAttempts: 2
      }
    ]
  }
};

module.exports = service;
