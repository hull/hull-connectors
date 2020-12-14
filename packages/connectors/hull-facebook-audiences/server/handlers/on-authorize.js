// @flow
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";

const _ = require("lodash");
const fbgraph = require("fbgraph");
const FacebookAudience = require("../lib/facebook-audience");

function onAuthorizeFactory({ clientID, clientSecret }: any) {
  function extendAccessToken(facebook_access_token: string) {
    return new Promise((resolve, reject) => {
      if (extendAccessToken && facebook_access_token) {
        fbgraph.extendAccessToken(
          {
            access_token: facebook_access_token,
            client_id: clientID,
            client_secret: clientSecret
          },
          (err, res) => {
            return err ? reject(err) : resolve(res.access_token);
          }
        );
      } else {
        resolve(facebook_access_token);
      }
    });
  }

  async function onAuthorize(
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ): HullOAuthAuthorizeResponse {
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
    const extended_token = await extendAccessToken(facebook_access_token);
    return {
      private_settings: {
        facebook_access_token: extended_token
      }
    };
  }
  return onAuthorize;
}

export default onAuthorizeFactory;
