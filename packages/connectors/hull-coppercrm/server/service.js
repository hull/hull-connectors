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

const {
  CopperCRMIncomingLead,
  CopperCRMOutgoingLead,
  CopperCRMOutgoingExistingLead,
  CopperCRMIncomingPerson,
  CopperCRMIncomingCompany,
  CopperCRMIncomingOpportunity,
  CopperCRMIncomingActivity
  } = require("./service-objects");

const { SuperagentApi } = require("hull-connector-framework/src/purplefusion/superagent-api");


const service = ({ clientID, clientSecret } : {
  clientID: string,
  clientSecret: string
}): RawRestApi => ({
  initialize: (context, api) => new SuperagentApi(context, api),
  // This is set by the ensureSetup endpoint in the glue
  prefix: "https://api.prosperworks.com/developer_api",
  defaultReturnObj: "body",
  endpoints: {
    updateLead: {
      url: "/v1/leads/${leadId}",
      operation: "put",
      input: CopperCRMOutgoingExistingLead,
      output: CopperCRMIncomingLead
    },
    upsertLead: {
      url: "/v1/leads/upsert",
      operation: "put",
      input: CopperCRMOutgoingLead,
      output: CopperCRMIncomingLead
    },
    getUsers: {
      url: "/v1/users/search",
      operation: "post",
      query: {
        "page_size": 200,
        "page_number": 1
      }
    },
    getActivityTypes: {
      url: "/v1/activity_types",
      operation: "get"
    },
    getCustomFields: {
      url: "/v1/custom_field_definitions",
      operation: "get"
    },
    getLeadStatuses: {
      url: "/v1/lead_statuses",
      operation: "get"
    },
    getCustomerSources: {
      url: "/v1/customer_sources",
      operation: "get"
    },
    getContactTypes: {
      url: "/v1/contact_types",
      operation: "get"
    },
    getLossReasons: {
      url: "/v1/loss_reasons",
      operation: "get"
    },
    getPipelines: {
      url: "/v1/pipelines",
      operation: "get"
    },
    getPipelineStages: {
      url: "/v1/pipeline_stages",
      operation: "get"
    },
    getPersonById: {
      url: "/v1/people/${attributeId}",
      operation: "get"
    },
    fetchRecentLeads: {
      url: "/v1/leads/search",
      operation: "post",
      output: CopperCRMIncomingLead,
      query: {
        "sort_by": "date_modified",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_modified_date": "${dateOffset}"
      }
    },
    fetchAllLeads: {
      url: "/v1/leads/search",
      operation: "post",
      output: CopperCRMIncomingLead,
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${dateOffset}"
      }
    },
    fetchRecentPeople: {
      url: "/v1/people/search",
      operation: "post",
      output: CopperCRMIncomingPerson,
      query: {
        "sort_by": "date_modified",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_modified_date": "${dateOffset}"
      }
    },
    fetchAllPeople: {
      url: "/v1/people/search?sort_by=date_modified&sort_direction=desc",
      operation: "post",
      output: CopperCRMIncomingPerson,
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${dateOffset}"
      }
    },
    fetchRecentCompanies: {
      url: "/v1/companies/search",
      operation: "post",
      output: CopperCRMIncomingCompany,
      query: {
        "sort_by": "date_modified",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_modified_date": "${dateOffset}"
      },
    },
    fetchAllCompanies: {
      url: "/v1/companies/search",
      operation: "post",
      output: CopperCRMIncomingCompany,
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${dateOffset}"
      }
    },
    fetchRecentOpportunities: {
      url: "/v1/opportunities/search",
      operation: "post",
      output: CopperCRMIncomingOpportunity,
      query: {
        "sort_by": "date_modified",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_modified_date": "${dateOffset}"
      }
    },
    fetchAllOpportunities: {
      url: "/v1/opportunities/search",
      operation: "post",
      output: CopperCRMIncomingOpportunity,
      query: {
        "sort_by": "date_created",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_created_date": "${dateOffset}"
      }
    },
    fetchRecentActivities: {
      url: "/v1/activities/search",
      operation: "post",
      output: CopperCRMIncomingActivity,
      query: {
        "sort_by": "${datePathOnEntity}",
        "sort_direction": "desc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}"
      }
    },
    fetchAllActivities: {
      url: "/v1/activities/search",
      operation: "post",
      output: CopperCRMIncomingActivity,
      query: {
        "sort_by": "${datePathOnEntity}",
        "sort_direction": "asc",
        "page_size": "${pageSize}",
        "page_number": "${pageOffset}",
        "minimum_activity_date": "${dateOffset}"
      }
    },
    getAllWebhooks: {
      url: "/v1/webhooks",
      operation: "get"
    },
    deleteWebhook: {
      url: "/v1/webhooks/${webhook.id}",
      operation: "delete"
    },
    createWebhook: {
      url: "/v1/webhooks",
      operation: "post"
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
      {
        truthy: { status: 422 },
        errorType: SkippableError,
        message: "Copper has detected an issue with the data that you're trying to send, please inspect the attributes being sent to Copper for correct format, and that the entities you're trying to update are not ambiguous"
      },
      {
        truthy: { status: 404 },
        errorType: SkippableError,
        message: "Resource not found"
      }
    ]

  }
});


module.exports = service;
