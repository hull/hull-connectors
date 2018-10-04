const moment = require("moment");
const TypeformStrategy = require("passport-typeform").Strategy;
const { oAuthHandler } = require("../../../../hull/src/handlers");
const { settingsUpdate } = require("../../../../hull/src/utils");
const SyncAgent = require("../lib/sync-agent");

module.exports = oAuthHandler({
  name: "Typeform",
  Strategy: TypeformStrategy,
  tokenInUrl: false,
  options: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scope: [
      "forms:read",
      "responses:read",
      "webhooks:read",
      "webhooks:write",
      "workspaces:read",
      "offline"
    ]
  },
  isSetup(req) {
    const { access_token, refresh_token } = req.hull.connector.private_settings;

    if (access_token && refresh_token) {
      const syncAgent = new SyncAgent(req.hull);
      return syncAgent.getFormResponsesCount().then(completed => {
        return { completed, query: req.query };
      });
    }
    return Promise.reject();
  },
  onLogin() {
    return Promise.resolve();
  },
  onAuthorize(req) {
    const { accessToken, refreshToken } = req.account;
    return settingsUpdate(req.hull, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: req.account.params.expires_in,
      tokens_granted_at: moment().format("X")
    });
  },
  views: {
    login: "login.html",
    home: "home.html",
    failure: "failure.html",
    success: "success.html"
  }
});
