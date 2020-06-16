/* @flow */
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const _ = require("lodash");
const debug = require("debug")("hull-salesforce:oauth");

const onAuthorize = async (
  ctx: HullContext,
  message: HullOauthAuthorizeMessage
): HullOAuthAuthorizeResponse => {
  const { account = {} } = message;
  debug("onAuthorize req.account", account);
  const { refreshToken, params } = account || {};
  const { access_token, instance_url } = params || {};
  const salesforce_login = _.get(account, "profile._raw.username");

  if (!access_token) {
    throw new Error("Can't find access token");
  }

  return {
    private_settings: {
      refresh_token: refreshToken,
      access_token,
      token: access_token,
      instance_url,
      salesforce_login
    }
  };
};
export default onAuthorize;
