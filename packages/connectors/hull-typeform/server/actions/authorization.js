const moment = require("moment");
const TypeformStrategy = require("passport-typeform").Strategy;
const { oAuthHandler } = require("hull/src/handlers");
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
    const {
      access_token,
      refresh_token,
      form_id
    } = req.hull.connector.private_settings;

    if (access_token && refresh_token) {
      const syncAgent = new SyncAgent(req.hull);
      if (form_id) {
        return syncAgent.getFormResponsesCount().then(completed => {
          return { completed, form_present: true };
        });
      }
      return Promise.resolve({ form_present: false });
    }
    return Promise.reject();
  },
  onLogin() {
    return Promise.resolve();
  },
  onAuthorize(req) {
    const { accessToken, refreshToken } = req.account;
    return req.hull.helpers.settingsUpdate({
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
