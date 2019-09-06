/* @flow */
import type { HullContext, HullExternalResponse } from "hull";

const _ = require("lodash");

/**
 * Checks cache and resets value
 */
async function checkCache(ctx: HullContext): HullExternalResponse {
  const clientCredentials = _.get(ctx, "clientCredentials", {});
  const portalId = _.get(ctx, "connector.private_settings.portal_id");

  const orgSettings = _.pick(clientCredentials, "organization", "id", "secret");
  if (!_.isNil(portalId) && _.keys(orgSettings).length === 3) {
    const clientConfig = await ctx.cache.cache.get(`hubspot:${portalId}`);
    if (_.isNil(clientConfig)) {
      ctx.cache.cache.set(`hubspot:${portalId}`, ctx.clientCredentials, {
        ttl: 0
      });
    }
  }

  return {
    status: 200,
    data: {}
  };
}

module.exports = checkCache;
