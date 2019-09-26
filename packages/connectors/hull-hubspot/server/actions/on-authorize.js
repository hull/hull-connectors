/* @flow */
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const moment = require("moment");
const debug = require("debug")("hull-hubspot:oauth");

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

async function getCachedClientCredentials(ctx, portalId) {
  const cachedCredentials = await ctx.cache.cache.get(`hubspot:${portalId}`);

  if (_.isNil(cachedCredentials)) {
    return [];
  }

  if (!Array.isArray(cachedCredentials)) {
    const clientCredentials = [];
    clientCredentials.push(cachedCredentials);
    return clientCredentials;
  }

  return cachedCredentials;
}

function credentialsInCache(clientCredentials, pendingCredentials) {
  return clientCredentials.some(
    creds =>
      creds.id === pendingCredentials.id &&
      creds.organization === pendingCredentials.organization &&
      creds.secret === pendingCredentials.secret
  );
}

async function cacheClientCredentials(ctx, portalId) {
  const clientCredentials = await getCachedClientCredentials(ctx, portalId);
  const pendingCredentials = ctx.clientCredentials;

  if (!credentialsInCache(clientCredentials, pendingCredentials)) {
    clientCredentials.push(pendingCredentials);
    ctx.cache.cache.set(`hubspot:${portalId}`, clientCredentials, {
      ttl: 0
    });
  }
}

const onAuthorize = async (
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
  await cacheClientCredentials(ctx, portalId);

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
};
export default onAuthorize;
