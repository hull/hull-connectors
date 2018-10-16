const SHARED_MESSAGES = {
  MAPPING_UNSUPPORTEDTYPEOUTBOUND: unsupportedType => {
    return {
      id: "MappingUnsupportedTypeOutbound",
      message: `Failed to map Hull object to unsupported type '${unsupportedType}'.`,
      level: "Error",
      channel: "Operation",
      category: "DataTransformation"
    };
  },
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
      id: "Operation...",
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
        "No data will be sent from Hull to Outreach.io due to missing segments configuration.",
      level: "Warning",
      channel: "Configuration",
      category: "DataFlow"
    };
  }
};

module.exports = SHARED_MESSAGES;
