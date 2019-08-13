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
  RecoverableError,
  TransientError,
  SkippableError,
  LogicError,
  NotificationValidationError
} = require("hull/src/errors");

const OAuth2Strategy = require("passport-oauth2");
const HubspotStrategy = require("passport-hubspot-oauth2.0");
const MESSAGES = require("./messages");

const {} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");

const {
  isUndefinedOrNull
} = require("hull-connector-framework/src/purplefusion/utils");
const {
  isNull,
  notNull
} = require("hull-connector-framework/src/purplefusion/conditionals");
const { HubspotOutgoingDeal, HubspotIncomingDeal } = require("./service-objects");

// What about linking calls?
const service: RawRestApi = {
  initialize: (context, api) => new SuperagentApi(context, api),
  // This is set by the ensureSetup endpoint in the glue
  prefix: "https://api.hubapi.com",
  defaultReturnObj: "body",
  endpoints: {
    insertDeal: {
      url: "/deals/v1/deal",
      operation: "post",
      endpointType: "create",
      returnObj: "body",
      input: HubspotOutgoingDeal,
      output: HubspotIncomingDeal
    },
    updateDeal: {
      url: "/deals/v1/deal/${dealId}",
      operation: "put",
      endpointType: "update",
      returnObj: "body",
      input: HubspotOutgoingDeal,
      output: HubspotIncomingDeal
    },
    updateDealCompanyAssociation: {
      url: "/crm-associations/v1/associations",
      operation: "put",
      endpointType: "update",
      returnObj: "body"
    },
    getAllDeals: {
      url: "deals/v1/deal/paged?limit=250&offset=${offset}&properties=dealname",
      operation: "get",
      returnObj: "body.properties",
      endpointType: "byProperty",
      output: HubspotIncomingDeal
    },
    refreshToken: {
      url: "https://api.hubapi.com/oauth/v1/token",
      operation: "post",
      endpointType: "create",
      settings: [
        { method: "set", params: { "Content-Type": "application/x-www-form-urlencoded" } }
      ]
    },
  },
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" } },
      {
        method: "set",
        params: {
          Authorization: "Bearer ${connector.private_settings.access_token}"
        }
      }
    ],
    headersToMetrics: {
      "x-rate-limit-limit": "ship.service_api.remaining",
      "x-rate-limit-remaining": "ship.service_api.limit"
    }
  },
  authentication: {
    strategy: "hubspotoauth",
    params: {
      name: "Hubspot",
      Strategy: HubspotStrategy,
      options: {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        authorizationURL: "https://app.hubspot.com/oauth/authorize",
        tokenURL: "https://api.hubapi.com/oauth/v1/token",
        grant_type: "authorization_code",
        scope: ["oauth", "contacts", "timeline"]
      }
    }
  },
  error: {
    parser: {
      httpStatus: "status",
      parser: {
        type: "json",
        target: "response.text",
        appStatusCode: "errors[0].id",
        title: "errors[0].title",
        description: "errors[0].detail",
        source: "errors[0].source"
      }
    },

    templates: [
      {
        truthy: { status: 401 },
        condition: isNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND,
        recoveryroute: "refreshToken"
      },
      {
        truthy: { status: 401 },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_UNAUTHORIZED_ACCESS_TOKEN,
        recoveryroute: "refreshToken"
      },
      {
        truthy: { status: 404 },
        errorType: SkippableError,
        message: MESSAGES.DEAL_NOT_FOUND
      }
    ]
  }
};

module.exports = service;
