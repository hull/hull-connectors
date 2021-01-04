/* @flow */
import type {
  RawRestApi
} from "hull-connector-framework/src/purplefusion/types";

const _ = require("lodash");

const {
  ConfigurationError
} = require("hull/src/errors");

const OAuth2Strategy = require("passport-oauth2");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");

const service = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://api.calendly.com",
  defaultReturnObj: "body",
  endpoints: {
    introspect: {
      url: "https://auth.calendly.com/oauth/introspect",
      operation: "post"
    },
    me: {
      url: "/users/me",
      operation: "get"
    },
    getAllWebhooks: {
      url: "/webhook_subscriptions?organization=${organization}&scope=organization",
      operation: "get",
      endpointType: "fetchAll",
      returnObj: "body.collection"
    },
    insertWebhook: {
      url: "/webhook_subscriptions?organization=${organization}&scope=organization",
      operation: "post",
      endpointType: "create"
    },
    deleteWebhook: {
      url: "/webhook_subscriptions/${webhook_uuid}",
      operation: "delete",
      endpointType: "delete"
    },
    refreshToken: {
      url: "https://auth.calendly.com/oauth/token",
      operation: "post",
      endpointType: "create",
      returnObj: "body"
    },
  },
  superagent: {
    settings: [
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
  authentication: {
    strategy: "oauth2",
    params: {
      Strategy: OAuth2Strategy,
      clientID,
      clientSecret
    }
  },
  error: {
    templates: [
      {
        truthy: { status: 401 },
        errorType: ConfigurationError,
        recoveryroute: "refreshToken"
      }
    ]
  }
});

module.exports = service;
