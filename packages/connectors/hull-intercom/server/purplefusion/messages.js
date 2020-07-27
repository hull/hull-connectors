const MESSAGES = {
  BAD_REQUEST: () => {
    return {
      id: "BadRequest",
      message: "Client Error",
      level: "Information"
    }
  },
  STATUS_NO_ACCESS_TOKEN_FOUND: () => {
    return {
      id: "StatusNoAccessTokenFound",
      message:
        'No OAuth AccessToken found.  Please make sure to allow Hull to access your Intercom data by clicking the "Credentials" button on the connector page and following the workflow provided',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  INVALID_ACCESS_TOKEN: () => {
    return {
      id: "InvalidAccessToken",
      message:
        'Invalid AccessToken found.  Please make sure to allow Hull to access your Intercom data by clicking the "Credentials" button on the connector page and following the workflow provided',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  OPERATION_EXCEEDED_RATE_LIMIT: () => {
    return {
      id: "OperationExceededRateLimit",
      message: "Connector has exceeded the rate limit",
      level: "Information",
      channel: "Operation",
      category: "DataFlow"
    }
  },
  PAYMENT_REQUIRED: () => {
    return {
      id: "PaymentRequired",
      message: "Payment Required -- The Intercom API is not available on your current plan",
      level: "Information"
    }
  },
  FORBIDDEN: () => {
    return {
      id: "ForbiddenRequest",
      message: "Forbidden -- The request is not allowed",
      level: "Information"
    }
  },
  NOT_FOUND: () => {
    return {
      id: "NotFound",
      message: "Not Found -- The resource was not found",
      level: "Information"
    }
  },
  METHOD_NOT_ALLOWED: () => {
    return {
      id: "MethodNotAllowed",
      message: "Method Not Allowed -- The resource does not accept the HTTP method",
      level: "Information"
    }
  },
  NOT_ACCEPTABLE: () => {
    return {
      id: "NotAcceptable",
      message: "Not Acceptable -- The resource cannot return the client's required content type",
      level: "Information"
    }
  },
  REQUEST_TIMEOUT: () => {
    return {
      id: "RequestTimeout",
      message: "Request Timeout -- The server would not wait any longer for the client",
      level: "Information"
    }
  },
  CONFLICT: () => {
    return {
      id: "Conflict",
      message: "Conflict - Multiple existing users match this email address - must be more specific using user_id",
      level: "Information"
    }
  },
  UNSUPPORTED_MEDIA_TYPE: () => {
    return {
      id: "UnsupportedMediaType",
      message: "Unsupported Media Type - The server doesn't accept the submitted content-type",
      level: "Information"
    }
  },
  TOO_MANY_REQUESTS: () => {
    return {
      id: "TooManyRequests",
      message: "Too Many Requests -- The client has reached or exceeded a rate limit, or the server is overloaded",
      level: "Information"
    }
  },
  UNPROCESSABLE_ENTITY: () => {
    return {
      id: "UnprocessableEntity",
      message: "Unprocessable Entity -- The data was well-formed but invalid",
      level: "Information"
    }
  },
  INTERCOM_INTERNAL_SERVER_ERROR: () => {
    return {
      id: "IntercomServerError",
      message: "Intercom Internal Server Error",
      level: "Information"
    }
  }
};

module.exports = MESSAGES;
