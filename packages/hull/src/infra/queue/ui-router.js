const { Router } = require("express");
const basicAuth = require("basic-auth");

const auth = pass => (req, res, next) => {
  const user = basicAuth(req) || {};
  if (user.pass !== pass) {
    res.set("WWW-Authenticate", "Basic realm=Authorization Required");
    return res.sendStatus(401);
  }
  return next();
};

module.exports = function queueUiRouter({ hostSecret, queue }) {
  const router = Router();
  router.use(auth(hostSecret));
  queue.adapter.setupUiRouter(router);
  return router;
};
