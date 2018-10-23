/* @flow */
const oauth = require("../lib/oauth-client");

function OAuthRouter() {
  const shipConfig = {
    hostSecret: process.env.SECRET,
    clientID: process.env.MAILCHIMP_CLIENT_ID,
    clientSecret: process.env.MAILCHIMP_CLIENT_SECRET
  };

  return oauth({
    name: "Mailchimp",
    clientID: shipConfig.clientID,
    clientSecret: shipConfig.clientSecret,
    callbackUrl: "/callback",
    homeUrl: "/",
    selectUrl: "/select",
    syncUrl: "/sync",
    site: "https://login.mailchimp.com",
    tokenPath: "/oauth2/token",
    authorizationPath: "/oauth2/authorize",
    hostSecret: shipConfig.hostSecret
  });
}

module.exports = OAuthRouter;
