function syncIn(req, res, next) {
  return req.shipApp.queueAgent.create("syncIn").then(next, next);
}

module.exports = syncIn;
