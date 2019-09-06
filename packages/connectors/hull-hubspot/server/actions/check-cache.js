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
    ctx.cache.cache.ttl(`hubspot:${portalId}`, (err, ttl) => {
      if (ttl) {
        const thirtyMinutes = 60 * 30;
        if (ttl < thirtyMinutes) {
          ctx.cache.cache.set(`hubspot:${portalId}`, ctx.clientCredentials, {
            ttl: 86400
          });
        }
      }
    });
  }

  return {
    status: 200,
    data: {}
  };
}

module.exports = checkCache;
