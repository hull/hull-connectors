import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage,
  HullOAuthStatusResponse,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const _ = require("lodash");

const oauth2 = {
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
          message: "Connected to Outreach"
        }
      };
    }
    return {
      status: 400,
      data: {
        message: "Please authenticate with Outreach"
      }
    };
  },
  onLogin: async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullExternalResponse => ({
    ...message.body,
    ...message.query
  }),
  onAuthorize: async (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ): HullOAuthAuthorizeResponse => {
    // access_token, expires_in, refresh_token, created_at
    // for some reason, refreshToken looks like it's at the top level
    // and the more detailed variables are in a params object below req.account
    const { account = {} } = message;
    const { refreshToken, params } = account;
    const { access_token, expires_in, created_at } = params || {};
    return {
      private_settings: {
        token_expires_in: expires_in,
        token_created_at: created_at,
        refresh_token: refreshToken,
        access_token
      }
    };
  }
};

module.exports = {
  oauth2
};
