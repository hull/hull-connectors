//need to know if this message structure actually triggers particular behavior
// or if it was just by convention, and some stuff may mean nothing

const MESSAGES = {
  MAPPING_NOOUTBOUNDFIELDS: () => {
    return {
      id: "MappingNoOutboundFields",
      message:
        "The mapping utility hasn't been initialized with any field mappings.",
      level: "Error",
      channel: "Operation",
      category: "DataTransformation"
    };
  },
  OPERATION_SKIP_NOACCOUNTIDENT: attribName => {
    return {
      id: "OperationSkipAccountNoServiceIdentValue",
      message: `The Hull account has no value for the unique identifier attribute '${attribName}'`,
      level: "Information",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  OPERATION_GREATER_THAN_10000_ENTITIES: () => {
    return {
      id: "OperationGreaterThan10000Entities",
      message:
        "Attempting to pull more than 10000 accounts from Outreach which is not allowed, please contact customer support for a custom batch load",
      level: "Information",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  OPERATION_SKIP_NOMATCHUSERSEGMENTS: () => {
    return {
      id: "OperationSkipUserNotMatchingSegments",
      message:
        "The Hull user is not part of any whitelisted segment, the user won't be synchronized as prospect to Outreach.io.",
      level: "Information",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS: () => {
    return {
      id: "OperationSkipAccountNotMatchingSegments",
      message:
        "The Hull account is not part of any whitelisted segment, the account won't be synchronized as account to Outreach.io.",
      level: "Information",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  STATUS_WARNING_NOSEGMENTS: () => {
    return {
      id: "StatusNoSegmentsWhitelisted",
      message:
        "No data will be sent from Hull to Outreach.io because there are no whitelisted segments configured.  Please visit the connector settings page and add segments to be sent to Outreach.io.",
      level: "Warning",
      channel: "Configuration",
      category: "DataFlow"
    };
  },
  STATUS_CONNECTOR_MIDDLEWARE_MISCONFIGURED: () => {
    return {
      id: "StatusConnectorMiddlewareMisconfigured",
      message:
        "The status endpoint is did not parse the incoming request properly.  Either the request was malformed, or the middleware for this connector is misconfigured.  Please contact support to ensure the connector is running properly",
      level: "Error",
      channel: "Configuration",
      category: "Dataflow"
    };
  },
  STATUS_NO_ACCESS_TOKEN_FOUND: () => {
    return {
      id: "StatusNoAccessTokenFound",
      message:
        'No OAuth AccessToken found.  Please make sure to allow Hull to access your Outreach data by clicking the "Credentials" button on the connector page and following the workflow provided',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  STATUS_UNAUTHORIZED_ACCESS_TOKEN: () => {
    return {
      id: "StatusUnauthorizedAccessToken",
      message:
        'API AccessToken no longer valid, please authenticate with Outreach again using the Credentials button on the settings page',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  SERVICE_VALIDATION_ERROR: () => {
    return {
      id: "ServiceValidationError",
      message:
        "Outreach has rejected the objects being sent, please review attributes that you have in your filters to make sure that you've selected all the fields that outreach requires, if you think this is not correct, please contact Hull support",
      level: "Error",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  BAD_RESOURCE_REQUEST_ERROR: () => {
    return {
      id: "ResourceRequestError",
      message:
        "Outreach has rejected the objects being sent, please review the object for any old relationships that may not exist anymore. If you think this is not correct, please contact Hull support",
      level: "Error",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  SERVICE_PROSPECT_IS_OWNER_ERROR: () => {
    return {
      id: "ServiceValidationError",
      message:
        "Outreach has rejected the prospect being sent, because the email address violated the exclusion rules.  Please check to see if the domain corresponds to the owner of the account and exclude the owner's domain from prospects being synchronized in the segment",
      level: "Error",
      channel: "Operation",
      category: "DataFlow"
    };
  },
  UNKNOWN_SERVICE_ERROR: () => {
    return {
      id: "UnknownServiceError",
      message:
        'The system has been unable to identify the error that took place. Please contact your Hull support if this error is a critical issue.',
      level: "Error",
      channel: "Operation",
      category: "Unknown"
    };
  },
  INTERNAL_SERVICE_ERROR: () => {
    return {
      id: "InternalServiceError",
      message:
        'The Outreach system has thrown an error.  Hull has tried to recover, but was unable.  Please contact your Hull Service Representative so that they can contact Outreach and inform them of this bug',
      level: "Error",
      channel: "Operation",
      category: "Unknown"
    };
  },
  OUTREACH_ENTITY_NOT_FOUND: () => {
    return {
      id: "OutreachEntityNotFound",
      message: "Entity not found in outreach.",
      level: "Error",
      channel: "Operation",
      category: "Unknown"
    };
  }
};

module.exports = MESSAGES;
