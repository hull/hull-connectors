const _ = require("lodash");

const FacebookAudience = require("../lib/facebook-audience");

function segmentDeleteSmartNotifier(
  { client, connector, helpers, usersSegments, metric },
  messages
) {
  const handler = new FacebookAudience(
    connector,
    client,
    helpers,
    usersSegments,
    metric
  );
  if (!handler.isConfigured()) {
    return {
      status: 403,
      data: {
        message: "Missing credentials, skipping"
      }
    };
  }
  return handler.handleSegmentDelete(_.get(messages, 0));
}

module.exports = segmentDeleteSmartNotifier;
