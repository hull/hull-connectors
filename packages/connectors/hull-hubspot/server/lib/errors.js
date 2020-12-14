const { ConfigurationError, RateLimitError } = require("hull/src/errors");

const ERRORS = {
  401: {
    message: "UNAUTHORIZED",
    errorType: ConfigurationError,
    retry: 1
  },
  429: {
    message: "RATE_LIMIT",
    errorType: RateLimitError,
    retry: 3
  }
};

module.exports = ERRORS;
