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
  const { params } = account || {};
  const { access_token } = params || {};

  if (!access_token) {
    throw new Error("Can't find access token");
  }

  return {
    private_settings: {
      access_token
    }
  };
};
export default onAuthorize;
