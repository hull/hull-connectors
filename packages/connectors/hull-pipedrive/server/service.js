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
      query: "sort=id ASC&[limit]100",
      endpointType: "fetchAll",
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
      }
    ]
  }
});

module.exports = service;
