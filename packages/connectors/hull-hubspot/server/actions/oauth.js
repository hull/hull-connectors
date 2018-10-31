/* @flow */
const HubspotStrategy = require("passport-hubspot-oauth2.0");
const { oAuthHandler } = require("hull/src/handlers");
const moment = require("moment");
const Promise = require("bluebird");
const debug = require("debug")("hull-hubspot:oauth");

const SyncAgent = require("../lib/sync-agent");

function oAuthAction(deps: Object) {
  const { clientID, clientSecret } = deps;

  return oAuthHandler({
    name: "Hubspot",
    Strategy: HubspotStrategy,
    options: {
      clientID,
      clientSecret,
      scope: ["oauth", "contacts", "timeline"]
    },
    isSetup(req) {
      const { client, connector } = req.hull;
      if (req.query.reset) return Promise.reject(new Error("Requested reset"));
      const { token } = connector.private_settings || {};
      if (token) {
        const syncAgent = new SyncAgent(req.hull);
        // TODO: we have notices problems with syncing hull segments property
        // TODO: check if below code works after hull-node upgrade.
        // after a Hubspot resync, there may be a problem with notification
        // subscription. Following two lines fixes that problem.
        // AppMiddleware({ queueAdapter, shipCache, instrumentationAgent })(req, {}, () => {});
        syncAgent.syncConnector().catch(err =>
          client.logger.error("connector.configuration.error", {
            errors: ["Error in creating segments property", err]
          })
        );

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
      const syncAgent = new SyncAgent(req.hull);
      return syncAgent.hubspotClient.agent
        .get(`/oauth/v1/access-tokens/${accessToken}`)
        .then(res => {
          const portalId = res.body.hub_id;
          const newConnector = {
            portal_id: portalId,
            refresh_token: refreshToken,
            token: accessToken,
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
  });
}

module.exports = oAuthAction;
