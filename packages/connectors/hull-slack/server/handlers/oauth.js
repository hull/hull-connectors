/* @flow */
import type { HullOAuthRequest, HullOAuthHandlerParams } from "hull";
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
  isSetup: async req => {
    const { connector, client } = req.hull;
    if (req.query.reset) throw new Error("not setup");
    const { private_settings = {} } = connector;
    const { token, bot = {} } = private_settings;
    const { bot_access_token } = bot;
    try {
      console.log("isSetup", private_settings);
      await connectSlack({
        client,
        connector: req.hull.connector
      });
      if (!!token && !!bot_access_token) {
        return {
          status: 200,
          data: {
            credentials: true,
            connected: true
          }
        };
      }
    } catch (err) {
      client.logger.info("oauth.setupTest.failed", {
        error: err.message
      });
    }
    return {
      status: 404,
      data: {
        credentials: false,
        connected: false
      }
    };
  },
  onAuthorize: async (req: HullOAuthRequest) => {
    const { hull = {} } = req;
    const { client, connector } = hull;
    if (!client || !connector) {
      throw new Error("Error, no Ship or Client");
    }

    const { accessToken, params = {} } = req.account || {};
    const { ok, bot = {}, team_id, user_id, incoming_webhook = {} } = params;
    if (!ok) {
      throw new Error("Error, invalid reply");
    }
    const connectorData = {
      private_settings: {
        ...connector.private_settings,
        incoming_webhook,
        bot,
        team_id,
        user_id,
        token: accessToken
      }
    };
    await connectSlack({ hull: client, connector: connectorData });
    await client.put(connector.id, connectorData);
  }
});
