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

async function getCachedClientCredentials(ctx, credentialsKey) {
  const { connectorName } = ctx.clientConfig;

  const cachedCredentials = await ctx.cache.cache.get(
    `${connectorName}:${credentialsKey}`
  );

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

async function cacheClientCredentials(ctx, options) {
  const { credentialsKey, appendCredentials } = options;
  let cacheCredentials = await getCachedClientCredentials(ctx, credentialsKey);
  const { connectorName } = ctx.clientConfig;
  const { clientCredentials } = ctx;

  if (
    clientCredentials &&
    !credentialsInCache(cacheCredentials, clientCredentials)
  ) {
    if (appendCredentials) {
      cacheCredentials.push(clientCredentials);
    } else {
      cacheCredentials = [clientCredentials];
    }

    return ctx.cache.cache.set(
      `${connectorName}:${credentialsKey}`,
      cacheCredentials,
      {
        ttl: 0
      }
    );
  }
}

module.exports = {
  cacheClientCredentials
};
