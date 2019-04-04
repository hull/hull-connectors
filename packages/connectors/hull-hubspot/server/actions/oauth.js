/* @flow */
import type { HullOAuthRequest, HullOAuthHandlerParams } from "hull";

const HubspotStrategy = require("passport-hubspot-oauth2.0");
const moment = require("moment");
const Promise = require("bluebird");
const debug = require("debug")("hull-hubspot:oauth");

const SyncAgent = require("../lib/sync-agent");

const handler = ({
  clientID,
  clientSecret
}: Object): HullOAuthHandlerParams => ({
  clientID,
  clientSecret,
  Strategy: HubspotStrategy,
  isSetup: async req => {
    const { client, connector } = req.hull;
    if (req.query.reset) return Promise.reject(new Error("Requested reset"));
    const { token } = connector.private_settings || {};
    try {
      if (token) {
        const syncAgent = new SyncAgent(req.hull);
        // TODO: we have notices problems with syncing hull segments property
        // TODO: check if below code works after hull-node upgrade.
        // after a Hubspot resync, there may be a problem with notification
        // subscription. Following two lines fixes that problem.
        // AppMiddleware({ queueAdapter, shipCache, instrumentationAgent })(req, {}, () => {});
        await syncAgent.syncConnector();
        const s = await client.get(connector.id);
        return {
          status: 200,
          data: { settings: s.private_settings }
        };
      }
      throw new Error("Not authorized");
    } catch (err) {
      client.logger.error("connector.configuration.error", {
        errors: ["Error in creating segments property", err]
      });
    }
    return {
      status: 200
    };
  },
  onLogin: async (req: HullOAuthRequest) => {
    req.authParams = { ...req.body, ...req.query };
    return {
      status: 200,
      data: {}
    };
  },
  onAuthorize: async (req: HullOAuthRequest) => {
    const { account = {} } = req;
    debug("onAuthorize req.account", account);
    const { params, refreshToken, accessToken } = account;
    const { expires_in } = params;
    const syncAgent = new SyncAgent(req.hull);

    if (!accessToken) {
      throw new Error("Can't find access token");
    }

    const res = await syncAgent.hubspotClient.agent.get(
      `/oauth/v1/access-tokens/${accessToken}`
    );
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
    await req.hull.helpers.settingsUpdate(newConnector);
    return {
      status: 200,
      data: {}
    };
  }
});

module.exports = handler;
