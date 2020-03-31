/* @flow */
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";
import { cacheClientCredentials } from "./utils/cached-client-credentials-utils";

const moment = require("moment");
const debug = require("debug")("hull-hubspot:oauth");

const SyncAgent = require("../lib/sync-agent");

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
