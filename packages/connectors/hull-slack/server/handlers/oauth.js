/* @flow */
import type {
  HullContext,
  HullStatusResponse,
  HullIncomingHandlerMessage,
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

  isSetup: async (
    ctx: HullContext,
    message: HullIncomingHandlerMessage
  ): HullStatusResponse => {
    const { connector, client } = ctx;
    const { query = {} } = message;
    if (query.reset) throw new Error("not setup");
    const { private_settings = {} } = connector;
    const { token, bot = {} } = private_settings;
    const { bot_access_token } = bot;
    try {
      if (!bot_access_token) {
        return {
          status: "error",
          messages: ["Can't find access token"]
        };
      }
      console.log("isSetup", private_settings);
      await connectSlack({
        client,
        connector
      });
      if (!!token && !!bot_access_token) {
        return {
          status: "ok",
          messages: ["Connected to slack"]
        };
      }
    } catch (err) {
      client.logger.info("oauth.setupTest.failed", {
        error: err.message
      });
    }
    return {
      status: "error",
      messages: ["Can't Connect"]
    };
  },

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
    // await client.put(connector.id, connectorData);
  }
});
