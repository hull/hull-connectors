const OAuth2Strategy = require("passport-oauth2");
const { oAuthHandler } = require("hull/src/handlers");
const Promise = require("bluebird");
const _ = require("lodash");
const { settingsUpdate } = require("hull/src/utils");

const oAuthUrl = "https://api.outreach.io";

function oAuthAction(deps: Object) {
  const { clientID, clientSecret } = deps;

  return oAuthHandler({
    name: "Outreach",
    Strategy: OAuth2Strategy,
    tokenInUrl: true,
    options: {
      clientID,
      clientSecret,
      authorizationURL: `${oAuthUrl}/oauth/authorize`,
      tokenURL: `${oAuthUrl}/oauth/token`,
      grant_type: "authorization_code",
      scope: [
        "create_prospects",
        "prospects.all",
        "create_accounts",
        "accounts.all",
        "webhooks.all"
      ] // App Scope
    },
    isSetup(req) {
      const { connector } = req.hull;
      if (req.query.reset) return Promise.reject(new Error("Requested reset"));
      const { token } = connector.private_settings || {};
      if (token) {
        // We've got a token, We're all good!
        // TODO do we want to check to see if the token is good?
        Promise.resolve();
      }
      return Promise.reject(new Error("Not authorized"));
    },
    onLogin: req => {
      req.authParams = _.merge({}, req.body, req.query);
      return Promise.resolve(req.authParams);
    },
    onAuthorize: req => {
      const { refreshToken, params } = req.account || {};
      const { access_token } = params || {};
      return settingsUpdate(req.hull, {
        refresh_token: refreshToken,
        access_token
      });
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    }
  });
}

module.exports = oAuthAction;
