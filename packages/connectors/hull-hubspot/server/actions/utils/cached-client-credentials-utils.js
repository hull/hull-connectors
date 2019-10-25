const _ = require("lodash");

function credentialsInCache(clientCredentials, pendingCredentials) {
  return (
    !_.isNil(pendingCredentials) &&
    clientCredentials.some(
      creds =>
        creds.id === pendingCredentials.id &&
        creds.organization === pendingCredentials.organization &&
        creds.secret === pendingCredentials.secret
    )
  );
}

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

async function cacheClientCredentials(ctx, portalId) {
  const clientCredentials = await getCachedClientCredentials(ctx, portalId);
  const pendingCredentials = ctx.clientCredentials;

  if (
    pendingCredentials &&
    !credentialsInCache(clientCredentials, pendingCredentials)
  ) {
    clientCredentials.push(pendingCredentials);
    ctx.cache.cache.set(`hubspot:${portalId}`, clientCredentials, {
      ttl: 0
    });
  }
}

module.exports = {
  credentialsInCache,
  getCachedClientCredentials,
  cacheClientCredentials
};
