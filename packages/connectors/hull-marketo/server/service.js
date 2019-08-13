/* @flow */
import type { RawRestApi, EndpointType, RequestType } from "hull-connector-framework/src/purplefusion/types";

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

const {
  MarketoOutgoingLead,
  MarketoIncomingLead,
  MarketoIncomingLeadActivity,
  MarketoIncomingStreamLead,
  MarketoLeadAttributeDefinition,
  MarketoActivityTypeIdMap
  } = require("./service-objects");

const {
  HullOutgoingUser,
  HullOutgoingAccount,
  HullIncomingUser,
  HullIncomingAccount,
  HullConnectorEnumDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { SuperagentApi } = require("hull-connector-framework/src/purplefusion/superagent-api");

const { isUndefinedOrNull } = require("hull-connector-framework/src/purplefusion/utils");
const { isNull, notNull } = require("hull-connector-framework/src/purplefusion/conditionals");


// What about linking calls?
const service: RawRestApi = {
  initialize: (context, api) => new SuperagentApi(context, api),
  // This is set by the ensureSetup endpoint in the glue
  prefix: "${marketoApiUrl}",
  defaultReturnObj: "body",
  endpoints: {
    describeLeads: {
      url: "/rest/v1/leads/describe.json",
      operation: "get",
      // TODO this will mask top level return values so we can't detect errors for marketo
      // need to do this transformation last
      returnObj: "body.result",
      endpointType: "byProperty",
      output: MarketoLeadAttributeDefinition
    },
    getLeadsByProperty: {
      url: "/rest/v1/leads.json/",
      operation: "get",
      query: "filterType=${property}&filterValue=${values}",
      endpointType: "byProperty",
      output: MarketoIncomingLead
    },
    exportLeads: {
      url: "/bulk/v1/leads/export/create.json",
      operation: "post",
      returnObj: "body",
      endpointType: "fetchAll"
    },
    streamLatestLeadExport: {
      url: "/bulk/v1/leads/export/${exportId}/file.json",
      operation: "get",
      endpointType: "fetchAll",
      streamType: "csv",
      output: MarketoIncomingStreamLead
    },
    getLeadExportJobs: {
      url: "/bulk/v1/leads/export.json",
      returnObj: "body.result",
      operation: "get",
      endpointType: "fetchAll"
    },
    cancelLeadExportJob: {
      url: "/bulk/v1/leads/export/${leadExportId}/cancel.json",
      operation: "post",
      endpointType: "fetchAll"
    },
    enqueueLeadExportJob: {
      url: "/bulk/v1/leads/export/${leadExportId}/enqueue.json",
      operation: "post",
      endpointType: "fetchAll"
    },
    getLatestLeadActivity: {
      url: "/rest/v1/activities/leadchanges.json",
      query: "fields=${fields}&nextPageToken=${nextPageToken}",
      operation: "get",
      endpointType: "byLastSync"
    },
    getLatestLeadActivityPagingToken: {
      url: "/rest/v1/activities/pagingtoken.json",
      query: "sinceDatetime=${latestLeadSyncFormatted}",
      operation: "get",
      endpointType: "byLastSync"
    },
    getActivityIds: {
      url: "/rest/v1/activities/types.json",
      operation: "get",
      endpointType: "byLastSync"
    },
    getAuthenticationToken: {
      url: "/identity/oauth/token",
      query: "grant_type=client_credentials&client_id=${connector.private_settings.marketo_client_id}&client_secret=${connector.private_settings.marketo_client_secret}",
      operation: "get",
      endpointType: "byProperty",
    },
    getActivityTypeEnum: {
      url: "/rest/v1/activities/types.json",
      operation: "get",
      returnObj: "body.result",
      output: MarketoActivityTypeIdMap,
      transformTo: HullConnectorEnumDefinition,
      endpointType: "byProperty"
    },
    upsertLeads:  {
      url: "/rest/v1/leads.json",
      operation: "post",
      input: MarketoOutgoingLead,
      endpointType: "upsert",
      batch: true,
      // if no id (meaning update) most likely will be an index join
      // if has id, will do an id join
      // worst case is a natural key join, though that would mean, they returned the initial data
      // which seems a little weird and unlikely
      // right now do the same thing for error too, but may need different strategies for error in the future
      // hubspot is a good example of how on upsert uses index correlation strategy (users upsert), and for companies (update, uses id correlation)
      // hubspot post new companies, is 1-1 so don't have a case yet for new creation at a batch point other than using index correlation
      batchResultMap: {
        strategy: "index"
      }
    }
  },
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" }},
      // only set this if access token exists...
      // todo may need a way of erroring out if no access token found
      // or a way to control when we do and don't want it doing that
      { method: "set", params: { "Authorization": "Bearer ${connector.private_settings.access_token}"}}
    ],
    headersToMetrics: {
      "x-rate-limit-limit": "ship.service_api.remaining",
      "x-rate-limit-remaining": "ship.service_api.limit"
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
        truthy: { body: { errors: [{ code: "601" }] } },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: "Unauthorized, please try authenticating with Marketo api again",
        recoveryroute: "getAuthenticationToken"
      },
      {
        truthy: { body: { errors: [{ code: "602" }] } },
        condition: notNull("connector.private_settings.access_token"),
        errorType: ConfigurationError,
        message: "Unauthorized, please try authenticating with Marketo api again",
        recoveryroute: "getAuthenticationToken"
      }
    ]

  }
};


module.exports = service;
