const MESSAGES = {
  STATUS_NO_ACCESS_TOKEN_FOUND: () => {
    return {
      id: "StatusNoAccessTokenFound",
      message:
        'No OAuth AccessToken found.  Please make sure to allow Hull to access your Hubspot data by clicking the "Credentials" button on the connector page and following the workflow provided',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  STATUS_UNAUTHORIZED_ACCESS_TOKEN: () => {
    return {
      id: "StatusUnauthorizedAccessToken",
      message:
        "API AccessToken no longer valid, please authenticate with Hubspot again using the Credentials button on the settings page",
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  }
};

module.exports = MESSAGES;
