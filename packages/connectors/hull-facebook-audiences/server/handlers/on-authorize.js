// @flow
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const _ = require("lodash");
const FacebookAudience = require("../lib/facebook-audience");

const onAuthorize = async (
  ctx: HullContext,
  message: HullOauthAuthorizeMessage
): HullOAuthAuthorizeResponse => {
  const { account } = message;
  if (!account) {
    throw new Error("Not properly authenticated, please start again");
  }

  const { accessToken: facebook_access_token } = account;
  const { connector, client, helpers, usersSegments: segments, metric } = ctx;
  const updatedShip = _.cloneDeep(connector);

  _.set(
    updatedShip,
    "private_settings.facebook_access_token",
    facebook_access_token
  );

  const fb = new FacebookAudience(
    updatedShip,
    client,
    helpers,
    segments,
    metric
  );
  if (fb.isConfigured()) {
    try {
      await fb.sync();
    } catch (error) {
      return {
        status: 400,
        error,
        data: {
          message: "error while synching connector after authentication"
        }
      };
    }
  }

  return {
    private_settings: {
      facebook_access_token
    }
  };
};
export default onAuthorize;
