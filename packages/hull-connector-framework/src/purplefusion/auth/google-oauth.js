import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthStatusResponse,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";
import { cacheClientCredentials } from "../webhooks/cache-client-credentials";

const moment = require("moment");
const _ = require("lodash");

const googleOAuth = {
  onStatus: async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullOAuthStatusResponse => {
    const { connector } = ctx;
    const { private_settings = {} } = connector;
    const { access_token } = private_settings;
    if (access_token) {
      // We've got a token, We're all good!
      // TODO do we want to check to see if the token is good?
      return {
        status: 200,
        data: {
          message: "Connected"
        }
      };
    }
    return {
      status: 400,
      data: {
        message: "Please authenticate"
      }
    };
  },
  onLogin: async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => ({
    ...message.body,
    ...message.query,
    accessType: "offline",
    prompt: "consent"
  }),
  onAuthorize: async (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ): HullOAuthAuthorizeResponse => {
    const { cachedCredentials = {} } = ctx.clientConfig;
    const { cacheCredentials = false, appendCredentials = false, serviceKey, credentialsKeyPath } = cachedCredentials;

    const { account = {} } = message;
    const { params, refreshToken } = account;
    const { access_token, expires_in } = params || {};

    if (cacheCredentials && credentialsKeyPath && serviceKey) {
      const credentialsKey = _.get(account, credentialsKeyPath, null);
      if (credentialsKey) {
        await cacheClientCredentials(ctx, { credentialsKey, appendCredentials } );
      }
    }
    const returnObj = {
      private_settings: {
        token_expires_in: expires_in,
        token_fetched_at: moment().utc().format(),
        access_token
      }
    };
    // We don't wanna override a possibly already existing refresh token
    if (!_.isNil(refreshToken)) {
      returnObj.private_settings.refresh_token = refreshToken;
    }
    return returnObj
  }
};

module.exports = {
  googleOAuth
};
