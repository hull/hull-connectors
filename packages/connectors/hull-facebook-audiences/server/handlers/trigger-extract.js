const FacebookAudience = require("../lib/facebook-audience");

function triggerExtract(req, res) {
  if (!req.hull) {
    res.status(401).end("error");
  }
  const handler = new FacebookAudience(
    req.hull.ship,
    req.hull.client,
    req.hull.helpers,
    req.hull.segments,
    req.hull.metric
  );
  if (!handler.isConfigured()) {
    return res.status(403).end("Missing credentials");
  }

  if (!req.query.segment_id) {
    return res.status(400).end("Missing segment_id");
  }
  handler.triggerExtractJob(req.query.segment_id);
  return res.end("ok");
}

module.exports = triggerExtract;
