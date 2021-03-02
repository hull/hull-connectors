const MESSAGES = {
  BAD_REQUEST: () => {
    return {
      id: "BadRequest",
      message: "Client Error",
      level: "Information"
    }
  },
  STATUS_NO_API_KEY_FOUND: () => {
    return {
      id: "StatusNoApiKeyFound",
      message:
        'No API Key found.',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  INVALID_API_KEY: () => {
    return {
      id: "InvalidApiKey",
      message:
        'Invalid API Key found.',
      level: "Error",
      channel: "Configuration",
      category: "Authentication"
    };
  },
  FORBIDDEN: () => {
    return {
      id: "ForbiddenRequest",
      message: "Forbidden. Check API Key and Host",
      level: "Information"
    }
  }
};

module.exports = MESSAGES;
