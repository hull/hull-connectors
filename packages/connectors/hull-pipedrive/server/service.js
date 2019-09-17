/* @flow */
import type {
  RawRestApi,
  EndpointType,
  RequestType
} from "hull-connector-framework/src/purplefusion/types";

const {
  ConfigurationError,
  TransientError,
  SkippableError
} = require("hull/src/errors");

const OAuthStrategy = require("passport-oauth2");

const {
  PipedrivePersonWrite,
  PipedrivePersonRead,
  PipedriveOrgWrite,
  PipedriveOrgRead
} = require("./service-objects");

const {
  SuperagentApi
} = require("hull-connector-framework/src/purplefusion/superagent-api");
// const MESSAGES = require("./messages");
const { isNull, notNull } = require("hull-connector-framework/src/purplefusion/conditionals");

const service = ({ clientID, clientSecret }: {
  clientID: string,
  clientSecret: string
}): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://api-proxy.pipedrive.com",
  endpoints: {
    insertAccount: {
      url: "/organizations/${accountId}",
      operation: "post",
      endpointType: "create",
      returnObj: "body.data",
      input: PipedriveOrgWrite,
      output: PipedriveOrgRead
    },
    updateAccount: {
      url: "/organizations/${accountId}",
      operation: "put",
      endpointType: "update",
      returnObj: "body.data",
      input: PipedriveOrgWrite,
      output: PipedriveOrgRead
    },
    getAllPersons: {
      url: "/persons/",
      operation: "get",
      endpointType: "fetchAll",
      returnObj: "body.data",
      output: PipedrivePersonRead
    },
    getAllPersonsPaged: {
      url: "/persons/",
      operation: "get",
      query: "limit=100&start=${start}",
      endpointType: "fetchAll",
      returnObj: "body",
      output: PipedrivePersonRead
    },
    getAllOrgsPaged: {
      url: "/organizations/",
      operation: "get",
      query: "limit=100&start=${start}",
      endpointType: "fetchAll",
      returnObj: "body",
      output: PipedriveOrgRead
    },
    refreshToken: {
      url: "https://oauth.pipedrive.com/oauth/token",
      operation: "post",
      endpointType: "create",
      returnObj: "body",
      settings: [
        { method: "set", params: { "Content-Type": "application/x-www-form-urlencoded" } },
        { method: "set", params: { Authorization: "Basic ${refreshAuthorizationHeader}" } }
      ]
    },
    insertPerson: {
      url: "/persons",
      operation: "post",
      endpointType: "insert",
      returnObj: "body.data",
      output: PipedrivePersonRead
    },
    updatePerson: {
      url: "/persons/${id}",
      operation: "put",
      endpointType: "update",
      returnObj: "body.data",
      output: PipedrivePersonRead
    }
  },
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" }},
      { method: "set", params: { Authorization: "Bearer ${connector.private_settings.access_token}" }}
    ]
  },
  authentication: {
    strategy: "oauth2",
    params: {
      Strategy: OAuthStrategy,
      clientID,
      clientSecret
    }
  },
  error: {
    parser: {

    },
    templates: [
      {
        truthy: { status: 400 },
        errorType: SkippableError,
        message: ""
      },
      {
        truthy: { status: 401 },
        errorType: ConfigurationError,
        message: "API AccessToken no longer valid, please authenticate with Pipedrive again using the Credentials button on the settings page",
        recoveryroute: "refreshToken"
      }
    ]
  }
});

module.exports = service;
