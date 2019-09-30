/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import getCachedClientCredentials from "./get-cached-client-credentials";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

function credentialsInCache(clientCredentials, pendingCredentials) {
  return clientCredentials.some(
    creds =>
      creds.id === pendingCredentials.id &&
      creds.organization === pendingCredentials.organization &&
      creds.secret === pendingCredentials.secret
  );
}

async function checkCachedCredentials(ctx: HullContext): HullExternalResponse {
  const syncAgent = new SyncAgent(ctx);
  const portalInformation = (await syncAgent.getPortalInformation()) || {};

  const portalId = _.get(portalInformation, "portalId", null);
  if (portalId === null) {
    return {
      status: 200,
      data: {}
    };
  }

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

module.exports = checkCachedCredentials;
