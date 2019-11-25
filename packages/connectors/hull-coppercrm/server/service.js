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
  CopperCRMIncomingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingAccount,
  CopperCRMIncomingOpportunity
  } = require("./service-objects");

const {
  HullConnectorEnumDefinition
} = require("hull-connector-framework/src/purplefusion/hull-service-objects");

const { SuperagentApi } = require("hull-connector-framework/src/purplefusion/superagent-api");

const { isUndefinedOrNull } = require("hull-connector-framework/src/purplefusion/utils");
const { isNull, notNull } = require("hull-connector-framework/src/purplefusion/conditionals");


const service = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  // This is set by the ensureSetup endpoint in the glue
  prefix: "https://api.prosperworks.com/developer_api",
  defaultReturnObj: "body",
  endpoints: {
    fetchRecentLeads: {
      url: "/v1/leads/search",
      operation: "post",
      endpointType: "lastFetch",
      query: {
        "sort_by": "date_modified",
        "sort_direction": "asc",
        "page_size": "1",
        "page_number": "${pageOffset}",
        "minimum_modified_date": "${modifiedAtOffset}"
      },
      output: CopperCRMIncomingLead
    },
    fetchAllLeads: {
      url: "/v1/lead_statuses",
      operation: "get",
      endpointType: "lastFetch"
    },
    getLeadStatuses: {
      url: "/v1/leads/search",
      operation: "post",
      endpointType: "lastFetch",
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "1",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${createdAtOffset}"
      },
      output: CopperCRMIncomingLead
    },
    fetchRecentPeople: {
      url: "/v1/people/search",
      operation: "post",
      endpointType: "lastFetch",
      output: CopperCRMIncomingPerson
    },
    fetchAllPeople: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      endpointType: "fetchAll",
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "1",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${createdAtOffset}"
      },
      output: CopperCRMIncomingPerson
    },
    fetchRecentAccount: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      endpointType: "lastFetch",
      output: CopperCRMIncomingPerson
    },
    fetchAllAccounts: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      endpointType: "lastFetch",
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "1",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${createdAtOffset}"
      },
      output: CopperCRMIncomingPerson
    },
    fetchRecentOpportunities: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      endpointType: "lastFetch",
      output: CopperCRMIncomingPerson
    },
    fetchAllOpportunities: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      endpointType: "lastFetch",
      output: CopperCRMIncomingPerson
    }
  },
  superagent: {
    settings: [
      { method: "set", params: { "Content-Type": "application/json" }},
      // only set this if access token exists...
      // todo may need a way of erroring out if no access token found
      // or a way to control when we do and don't want it doing that
      { method: "set", params: { "X-PW-AccessToken": "${connector.private_settings.coppercrm_api_key}"}},
      { method: "set", params: { "X-PW-Application": "developer_api"}},
      { method: "set", params: { "X-PW-UserEmail": "${connector.private_settings.coppercrm_email}"}}
    ]
  },
  error: {

    parser: {
      httpStatus: "status",
      parser: {
        type: "json",
        target: "response.text",
        description: "message"
      }
    },

    templates: [
      {
        truthy: { status: 500 },
        errorType: TransientError,
        message: "The CopperCRM system has thrown an error.  Hull has tried to recover, but was unable.  Please contact your Hull Service Representative so that they can contact CopperCRM and inform them of this bug",
        retryAttempts: 2
      },
      {
        truthy: { status: 503 },
        errorType: TransientError,
        message: "The CopperCRM system has thrown an error.  Hull has tried to recover, but was unable.  Please contact your Hull Service Representative so that they can contact CopperCRM and inform them of this bug",
        retryAttempts: 2
      },
      {
        truthy: { status: 502 },
        errorType: TransientError,
        message: "The CopperCRM system has thrown an error.  Hull has tried to recover, but was unable.  Please contact your Hull Service Representative so that they can contact CopperCRM and inform them of this bug",
        retryAttempts: 3
      },
    ]

  }
});


module.exports = service;
