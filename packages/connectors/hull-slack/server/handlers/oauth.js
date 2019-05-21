/* @flow */
import type {
  HullContext,
  HullOAuthHandlerParams,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";
import { Strategy } from "passport-slack";

module.exports = ({
  clientID,
  clientSecret,
  connectSlack
}: {
  clientID: string,
  clientSecret: string,
  connectSlack: any => any
}) => (): HullOAuthHandlerParams => ({
  Strategy,
  clientID,
  clientSecret,
  onAuthorize: async (
    ctx: HullContext,
    message: HullOauthAuthorizeMessage
  ): HullOAuthAuthorizeResponse => {
    const { client, connector } = ctx;
    if (!client || !connector) {
      throw new Error("Error, no Ship or Client");
    }

    const { account = {} } = message;
    const { accessToken, params = {} } = account;
    const { ok, bot = {}, team_id, user_id } = params;
    if (!ok) {
      throw new Error("Error, invalid reply");
    }
    const connectorData = {
      private_settings: {
        ...connector.private_settings,
        oauth: {
          bot,
          team_id,
          user_id,
          token: accessToken
        }
      }
    };
    await connectSlack({ client, connector: connectorData });
    return connectorData;
  }
});
