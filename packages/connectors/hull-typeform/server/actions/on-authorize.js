// @flow
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const moment = require("moment");
// const debug = require("debug")("hull-typeform:oauth");

const onAuthorize = async (
  ctx: HullContext,
  message: HullOauthAuthorizeMessage
): HullOAuthAuthorizeResponse => {
  const { account } = message;
  if (!account) {
    return undefined;
  }
  const { accessToken, refreshToken, params = {} } = account;
  return {
    private_settings: {
      oauth: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: params.expires_in,
        tokens_granted_at: moment().format("X")
      }
    }
  };
};
export default onAuthorize;
