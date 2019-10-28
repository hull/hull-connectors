/* @flow */
import type {
  RawRestApi,
  EndpointType,
  RequestType
} from "hull-connector-framework/src/purplefusion/types";

const _ = require("lodash");
const MESSAGES = require("./messages");
const {
  ConfigurationError,
  RateLimitError
} = require("hull/src/errors");

const HubspotStrategy = require("passport-hubspot-oauth2.0");

const {} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const {
  isNull,
  notNull
} = require("hull-connector-framework/src/purplefusion/conditionals");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");

const { HubspotIncomingEmailEvents, HubspotEmailCampaign, HubspotMarketingEmail } = require("./service-objects");

const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullUserRaw,
  HullIncomingAccount,
  ServiceUserRaw
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

// What about linking calls?
const service: RawRestApi = {
  initialize: (context, api) => new SuperagentApi(context, api),
  // This is set by the ensureSetup endpoint in the glue
  prefix: "https://api.hubapi.com",
  defaultReturnObj: "body",
  endpoints: {
    getEmailCampaign: {
      url: "/email/public/v1/campaigns/${emailCampaignId}",
      operation: "get",
      endpointType: "byProperty",
      returnObj: "body",
      output: HubspotEmailCampaign
    },
    getMarketingEmails: {
      url: "/marketing-emails/v1/emails",
      operation: "get",
      endpointType: "byProperty",
      query: "id=${marketingEmailId}",
      returnObj: "body",
      output: HubspotMarketingEmail
    },
    getAllEmailEvents: {
      url: "/email/public/v1/events",
      operation: "get",
      query: "limit=${limit}",
      endpointType: "byProperty",
      returnObj: "body",
      output: HubspotIncomingEmailEvents
    },
    getAllEmailEventsWithOffset: {
      url: "/email/public/v1/events",
      operation: "get",
      query: "limit=${limit}&offset=${offset}",
      endpointType: "byProperty",
      returnObj: "body",
      output: HubspotIncomingEmailEvents
    },
    getRecentEmailEvents: {
      url: "/email/public/v1/events",
      operation: "get",
      query: "limit=${limit}&startTimestamp=${startTimestamp}",
      endpointType: "byProperty",
      returnObj: "body",
      output: HubspotIncomingEmailEvents
    },
    getRecentEmailEventsWithOffset: {
      url: "/email/public/v1/events",
      operation: "get",
      query: "limit=${limit}&startTimestamp=${startTimestamp}&offset=${offset}",
      endpointType: "byProperty",
      returnObj: "body",
      output: HubspotIncomingEmailEvents
    },
    refreshToken: {
      url: "https://api.hubapi.com/oauth/v1/token",
      operation: "post",
      endpointType: "create",
      settings: [
        { method: "set", params: { "Content-Type": "application/x-www-form-urlencoded" } }
      ]
    },
    getRecentContactsPage: {
      url: "/contacts/v1/lists/recently_updated/contacts/recent",
      operation: "get",
      query: "timeOffset=${offset}&property=${properties}&count=100"
    }
  },
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" } },
      {
        method: "set",
        params: {
          Authorization: "Bearer ${connector.private_settings.token}"
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
        scope: ["oauth", "contacts", "timeline", "content"]
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
        condition: isNull("connector.private_settings.token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND,
        recoveryroute: "refreshToken"
      },
      {
        truthy: { status: 401 },
        condition: notNull("connector.private_settings.token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_UNAUTHORIZED_ACCESS_TOKEN,
        recoveryroute: "refreshToken"
      },
      {
        truthy: { status: 429 },
        errorType: RateLimitError,
        message: "Hubspot temporary API rate limit exceeded, retrying in a moment",
        retry: 3
      }
    ]
  }
};

module.exports = service;
