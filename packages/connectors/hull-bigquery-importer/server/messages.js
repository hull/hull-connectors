const MESSAGES = {
  STATUS_UNAUTHORIZED_REFRESH_TOKEN: () => {
    return {
      id: "StatusUnauthorizedAccessToken",
      message:
        'API Refresh Token no longer valid, please re-authenticate with Google again using the "Start over button" in the settings page',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  GOOGLE_ENTITY_NOT_FOUND: () => {
    return {
      id: "GoogleEntityNotFound",
      message: "Entity not found in Google Cloud.",
      level: "Error",
      channel: "Operation",
      category: "Unknown"
    };
  },
  INVALID_QUERY: () => {
    return {
      id: "GoogleQueryInvalid",
      message: "Query invalid, please verify your query syntax",
      level: "Error",
      channel: "Operation"
    }
  }
};

module.exports = MESSAGES;
