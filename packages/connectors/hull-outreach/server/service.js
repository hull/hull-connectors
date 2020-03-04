/* @flow */
import type { RawRestApi, EndpointType, RequestType } from "hull-connector-framework/src/purplefusion/types";

const _ = require("lodash");

const {
  ConfigurationError,
  TransientError,
  SkippableError
} = require("hull/src/errors");


const OAuth2Strategy = require("passport-oauth2");
const {
  OutreachProspectWrite,
  OutreachProspectRead,
  OutreachAccountWrite,
  OutreachAccountRead
  } = require("./service-objects");

const { SuperagentApi } = require("hull-connector-framework/src/purplefusion/superagent-api");
const MESSAGES = require("./messages");
const { isNull, notNull } = require("hull-connector-framework/src/purplefusion/conditionals");


const service = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  prefix: "https://api.outreach.io/api/v2",
  defaultReturnObj: "body",
  endpoints: {
    getAccountById: {
      url: "/accounts/${accountId}",
      operation: "get",
      endpointType: "byId",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAccountByDomain: {
      url: "/accounts/",
      operation: "get",
      query: "filter[domain]=${accountDomain}",
      endpointType: "byProperty",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAccountByProperty: {
      url: "/accounts/",
      operation: "get",
      query: "filter[${property}]=${value}",
      endpointType: "byProperty",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAccountsByLastSync: {
      url: "/accounts/",
      operation: "get",
      query: "filter[updatedAt]=${connector.private_settings.lastSync}",
      endpointType: "byLastSync",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAllAccounts: {
      url: "/accounts/",
      operation: "get",
      endpointType: "fetchAll",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAllAccountsPaged: {
      url: "/accounts/",
      operation: "get",
      query: "sort=id&page[limit]=100&filter[id]=${id_offset}..inf",
      endpointType: "fetchAll",
      returnObj: "body.data",
      output: OutreachAccountRead
    },
    getAllProspects: {
      url: "/prospects/",
      operation: "get",
      endpointType: "fetchAll",
      returnObj: "body.data",
      output: OutreachProspectRead
    },
    getAllProspectsPaged: {
      url: "/prospects/",
      operation: "get",
      query: "sort=id&page[limit]=100&filter[id]=${id_offset}..inf",
      endpointType: "fetchAll",
      returnObj: "body.data",
      output: OutreachProspectRead
    },
    insertAccount: {
      url: "/accounts/",
      operation: "post",
      endpointType: "create",
      returnObj: "body.data",
      input: OutreachAccountWrite,
      output: OutreachAccountRead
    },
    updateAccount: {
      url: "/accounts/${accountId}",
      operation: "patch",
      endpointType: "update",
      returnObj: "body.data",
      input: OutreachAccountWrite,
      output: OutreachAccountRead
    },
    getProspectById: {
      url: "/prospects/${userId}",
      operation: "get",
      endpointType: "byId",
      returnObj: "body.data",
      output: OutreachProspectRead
    },
    getProspectByEmail: {
      url: "/prospects/",
      operation: "get",
      query: "filter[emails]=${userEmail}",
      endpointType: "byProperty",
      returnObj: "body.data",
      output: OutreachProspectRead
    },
    getProspectsByProperty: {
      url: "/prospects/",
      operation: "get",
      query: "filter[${property}]=${value}",
      returnObj: "body.data",
      endpointType: "byProperty",
      output: OutreachProspectRead
    },
    getProspectsByLastSync: {
      url: "/prospects/",
      operation: "get",
      returnObj: "body.data",
      query: "filter[updatedAt]=${lastSync}",
      endpointType: "byLastSync",
      output: OutreachProspectRead
    },
    insertProspect: {
      url: "/prospects/",
      operation: "post",
      endpointType: "create",
      returnObj: "body.data",
      input: OutreachProspectWrite,
      output: OutreachProspectRead
    },
    updateProspect: {
      url: "/prospects/${userId}",
      operation: "patch",
      endpointType: "update",
      returnObj: "body.data",
      input: OutreachProspectWrite,
      output: OutreachProspectRead
    },
    getAllWebhooks: {
      url: "/webhooks/",
      operation: "get",
      endpointType: "fetchAll",
      returnObj: "body.data"
    },
    insertWebhook: {
      url: "/webhooks/",
      operation: "post",
      endpointType: "create"
    },
    deleteWebhook: {
      url: "/webhooks/${webhookIdToDelete}",
      operation: "delete",
      endpointType: "delete"
    },
    refreshToken: {
      url: "https://api.outreach.io/oauth/token",
      operation: "post",
      endpointType: "create"
    },
    getUsers: {
      url: "/users/",
      operation: "get",
      endpointType: "fetchAll"
    },
    getUsersPaged: {
      url: "/users/",
      operation: "get",
      endpointType: "fetchAll",
      query: "page[limit]=${page_limit}&filter[id]=${id_offset}..inf",
      returnObj: "body.data"
    },
    getStages: {
      url: "/stages/",
      operation: "get",
      endpointType: "fetchAll"
    },
    getEvents: {
      url: "/events/",
      operation: "get",
      endpointType: "byProperty",
      query: "page[limit]=1000"
    },
    getEventsPaged: {
      url: "/events/",
      operation: "get",
      endpointType: "byProperty",
      query: "page[limit]=${page_limit}&filter[id]=${id_offset}..inf"
    },
    getRecentEvents: {
      url: "/events/",
      operation: "get",
      endpointType: "byProperty",
      query: "filter[eventAt]=${filterLimits}&sort=-eventAt&page[limit]=1000"
    },
    getEventsOffset: {
      url: "/events/",
      operation: "get",
      endpointType: "byProperty",
      query: "${offsetQuery}"
    },
    getMailingDetails: {
      url: "/mailings/${mailingId}/",
      operation: "get"
    },
    getSequences: {
      url: "/sequences/",
      operation: "get",
      returnObj: "body.data"
    },
    getSequencesPaged: {
      url: "/sequences/",
      operation: "get",
      returnObj: "body.data",
      query: "page[limit]=${page_limit}&filter[id]=${id_offset}..inf"
    },
    getSequenceStepsPaged: {
      url: "/sequenceSteps/",
      operation: "get",
      returnObj: "body.data",
      query: "page[limit]=${page_limit}&filter[id]=${id_offset}..inf"
    }
  },
  superagent: {
    settings: [
    { method: "set", params: { "Content-Type": "application/vnd.api+json" }},
    { method: "set", params: { "Authorization": "Bearer ${connector.private_settings.access_token}"}}
    ],
    headersToMetrics: {
      "x-rate-limit-limit": "ship.service_api.remaining",
      "x-rate-limit-remaining": "ship.service_api.limit"
    }
  },
  authentication: {
    strategy: "oauth2",
    params: {
      Strategy: OAuth2Strategy,
      clientID,
      clientSecret,
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
        source: "errors[0].source",
      }
    },

    templates: [
      {
        truthy: { status: 500 },
        errorType: TransientError,
        message: MESSAGES.INTERNAL_SERVICE_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 503 },
        errorType: TransientError,
        message: MESSAGES.INTERNAL_SERVICE_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 502 },
        errorType: TransientError,
        message: MESSAGES.INTERNAL_SERVICE_ERROR,
        retryAttempts: 3
      },
      {
        truthy: { status: 404 , response: { request: { method: "PATCH" } } },
        errorType: SkippableError,
        message: MESSAGES.OUTREACH_ENTITY_NOT_FOUND,
      },
      {
        truthy: { status: 404 , response: { request: { method: "GET" } } },
        errorType: SkippableError,
        message: MESSAGES.OUTREACH_ENTITY_NOT_FOUND,
        retryAttempts: 1
      },
      {
        truthy: { status: 404 },
        errorType: TransientError,
        message: MESSAGES.INTERNAL_SERVICE_ERROR,
        retryAttempts: 2
      },
      {
        truthy: { status: 401 },
        condition: isNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_NO_ACCESS_TOKEN_FOUND,
        recoveryroute: "refreshToken"
      },
      {
        truthy: { status: 401 },
        // Do I need to add in options to override the error parameters?
        // this case the error is in a response.text field...
        condition: notNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: MESSAGES.STATUS_UNAUTHORIZED_ACCESS_TOKEN,
        recoveryroute: "refreshToken",
      },
      // {
      //   truthy: { status: 422, response: { text: "{\"errors\":[{\"id\":\"validationError\",\"source\":{\"pointer\":\"/data\"},\"title\":\"Validation Error\",\"detail\":\"Contacts contact is using an excluded email address.\"}]}"} },
      //   errorType: ConfigurationError,
      //   toTimeline: true,
      //   message: MESSAGES.SERVICE_PROSPECT_IS_OWNER_ERROR
      // },
      {
        truthy: { status: 422 },
        errorType: SkippableError,
        message: MESSAGES.SERVICE_VALIDATION_ERROR
      },
      {
        truthy: { status: 400 },
        errorType: SkippableError,
        message: MESSAGES.BAD_RESOURCE_REQUEST_ERROR
      }
    ]

  }
});


module.exports = service;
