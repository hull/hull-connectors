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
};

module.exports = MESSAGES;
