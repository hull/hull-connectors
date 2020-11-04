import type { RawRestApi } from "hull-connector-framework/src/purplefusion/types";
import { SuperagentApi } from "hull-connector-framework/src/purplefusion/superagent-api";

const {
  ConfigurationError,
  SkippableError,
  ReturnableError
} = require("hull/src/errors");

const { notNull } = require("hull-connector-framework/src/purplefusion/conditionals");
const MESSAGES = require("./messages");

const service = () : RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://bigquery.googleapis.com/bigquery/v2",
  defaultReturnObj: "body",
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" }},
      { method: "set", params: { Authorization: "Bearer ${connector.private_settings.access_token}" }}
    ]
  },
  endpoints: {
    getProjects: {
      url: "/projects",
      operation: "get",
      returnObj: "body.projects"
    },
    obtainAccessToken: {
      url: "https://oauth2.googleapis.com/token?grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtAssertion}",
      operation: "post",
      endpointType: "create"
    },
    insertQueryJob: {
      url: "/projects/${projectId}/jobs",
      operation: "post"
    },
    getJob: {
      url: "/projects/${projectId}/jobs/${jobId}",
      operation: "get",
    },
    getJobResults: {
      url: "/projects/${projectId}/queries/${jobId}?maxResults=1000&pageToken=${pageToken}",
      operation: "get"
    },
    testQuery: {
      url: "/projects/${projectId}/queries",
      operation: "post"
    }
  },
  error: {
    parser: {
      httpStatus: "status",
      parser: {
        type: "json",
        target: "response.text",
        title: "errors[0].reason",
        description: "errors[0].message",
      }
    },
    templates: [
      {
        truthy: { status: 401 },
        condition: notNull("connector.private_settings.service_account_key"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_UNAUTHORIZED_REFRESH_TOKEN,
        recoveryroute: "obtainAccessToken",
      },
      {
        truthy: { status: 404 },
        errorType: SkippableError,
        message: MESSAGES.GOOGLE_ENTITY_NOT_FOUND
      },
      {
        truthy: { status: 400 },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ReturnableError,
        message: MESSAGES.INVALID_QUERY
      },
      {
        truthy: { status: 403 },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ReturnableError,
        message: MESSAGES.INVALID_QUERY
      }
    ]
  }
});

module.exports = service;
