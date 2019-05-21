/* @flow */
import type {
  HullContext,
  HullOauthAuthorizeMessage,
  HullOAuthAuthorizeResponse
} from "hull";
import type { ConnectSlackFunction } from "../types";

const onAuthorize = (connectSlack: ConnectSlackFunction) => async (
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
  await connectSlack({ ...ctx, connector: { ...connector, ...connectorData } });
  return connectorData;
};

export default onAuthorize;
