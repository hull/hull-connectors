/* @flow */
const HubspotStrategy = require("passport-hubspot-oauth2.0");
const { oAuthHandler } = require("hull/src/handlers");
const moment = require("moment");
const Promise = require("bluebird");
const debug = require("debug")("hull-hubspot:oauth");
const superagent = require("superagent");
const prefixPlugin = require("superagent-prefix");
const {
  superagentUrlTemplatePlugin,
  superagentInstrumentationPlugin
} = require("hull/src/utils");

const hubspotOAuth = {
    isSetup(req) {
      const { client, connector } = req.hull;
      if (req.query.reset) return Promise.reject(new Error("Requested reset"));
      const { access_token } = connector.private_settings || {};
      if (access_token) {
        return client.get(connector.id).then(s => {
          return { settings: s.private_settings };
        });
      }
      return Promise.reject(new Error("Not authorized"));
    },
    onLogin: req => {
      req.authParams = { ...req.body, ...req.query };
      return Promise.resolve();
    },
    onAuthorize: req => {
      debug("onAuthorize req.account", req.account);
      const { refreshToken, accessToken } = req.account || {};
      const { expires_in } = req.account.params;

      const agent = superagent
        .agent()
        .use(superagentUrlTemplatePlugin({}))
        /*.use(
          superagentInstrumentationPlugin({
            logger: req.hull.client.logger,
            metric: req.hull.metric
          })
        )*/
        .use(
          prefixPlugin(
            process.env.OVERRIDE_HUBSPOT_URL || "https://api.hubapi.com"
          )
        )
        .set("Authorization", `Bearer ${accessToken}`)
        .timeout({
          response: 5000
        });

      return agent
        .get(`/oauth/v1/access-tokens/${accessToken}`)
        .then(res => {
          const portalId = res.body.hub_id;
          const newConnector = {
            portal_id: portalId,
            refresh_token: refreshToken,
            access_token: accessToken,
            expires_in,
            token_fetched_at: moment()
              .utc()
              .format("x")
          };
          debug("onAuthorize updating settings", newConnector);
          return req.hull.helpers.settingsUpdate(newConnector);
        });
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    }
};

module.exports = {
  hubspotOAuth
};
