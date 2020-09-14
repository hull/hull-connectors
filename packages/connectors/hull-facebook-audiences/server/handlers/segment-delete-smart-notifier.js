const _ = require("lodash");

const FacebookAudience = require("../lib/facebook-audience");

function segmentDeleteSmartNotifier({ client, ship, helpers, segments, metric }, messages) {
  const handler = new FacebookAudience(ship, client, helpers, segments, metric);
  if (!handler.isConfigured()) {
    return Promise.resolve({
      message: "Missing credentials, skipping"
    });
  }
  return handler.handleSegmentDelete(_.get(messages, 0));
}

module.exports = segmentDeleteSmartNotifier;
