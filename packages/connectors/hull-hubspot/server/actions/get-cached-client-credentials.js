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

module.exports = getCachedClientCredentials;
