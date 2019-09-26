/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

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

async function checkCache(ctx: HullContext): HullExternalResponse {
  const portalId = _.get(ctx, "connector.private_settings.portal_id");

  const clientCredentials = await getCachedClientCredentials(ctx, portalId);
  const pendingCredentials = ctx.clientCredentials;

  if (!credentialsInCache(clientCredentials, pendingCredentials)) {
    clientCredentials.push(pendingCredentials);
    ctx.cache.cache.set(`hubspot:${portalId}`, clientCredentials, {
      ttl: 0
    });
  }

  return {
    status: 200,
    data: {}
  };
}

module.exports = checkCache;
