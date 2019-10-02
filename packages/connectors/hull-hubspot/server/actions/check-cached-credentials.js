/* @flow */
import type { HullContext, HullExternalResponse } from "hull";
import { cacheClientCredentials } from "./utils/cached-client-credentials-utils";

const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");

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

  await cacheClientCredentials(ctx, portalId);

  return {
    status: 200,
    data: {}
  };
}

module.exports = checkCachedCredentials;
