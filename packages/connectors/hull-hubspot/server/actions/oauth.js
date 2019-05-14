/* @flow */
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const HubspotStrategy = require("passport-hubspot-oauth2.0");
const moment = require("moment");
const debug = require("debug")("hull-hubspot:oauth");

const SyncAgent = require("../lib/sync-agent");

module.exports = ({
  clientID,
  clientSecret
}: {
  clientID: string,
  clientSecret: string
}) => (): HullOAuthHandlerParams => ({
  Strategy: HubspotStrategy,
  clientID,
  clientSecret,
  isSetup: async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => {
    const { client, connector } = ctx;
    if (message.query.reset) {
      throw new Error("Requested reset");
    }
    const { token } = connector.private_settings || {};
    try {
      if (token) {
        const syncAgent = new SyncAgent(ctx);
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
      return {
        status: 404,
        data: {
          error: err.message
        }
      };
    }
  },
  onLogin: async (ctx: HullContext, message: HullIncomingHandlerMessage) => {
    return {
      status: 200,
      data: { ...message.body, ...message.query }
    };
  },
  onAuthorize: async (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ): HullOAuthAuthorizeResponse => {
    const { account = {} } = message;
    debug("onAuthorize req.account", account);
    const { params, refreshToken, accessToken } = account;
    const { expires_in } = params;
    const syncAgent = new SyncAgent(ctx);

    if (!accessToken) {
      throw new Error("Can't find access token");
    }

    const res = await syncAgent.hubspotClient.agent.get(
      `/oauth/v1/access-tokens/${accessToken}`
    );
    const portalId = res.body.hub_id;
    return {
      private_settings: {
        portal_id: portalId,
        refresh_token: refreshToken,
        token: accessToken,
        expires_in,
        token_fetched_at: moment()
          .utc()
          .format("x")
      }
    };
  }
});
