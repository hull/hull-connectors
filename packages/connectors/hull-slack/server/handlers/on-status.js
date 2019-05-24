// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullOAuthStatusResponse
} from "hull";

const statusHandler = async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullOAuthStatusResponse => {
  const { connector } = ctx;
  const { private_settings = {} } = connector;
  const {
    token,
    team_id,
    bot: { bot_user_id, bot_access_token } = {}
  } = private_settings;
  if (token && bot_user_id && bot_access_token && team_id) {
    return {
      status: 200,
      data: {
        message: `Connected to team ${team_id}`,
        html: `Connected to team <span>${team_id}</span>`
      }
    };
  }
  return {
    status: 400,
    data: {
      message: "Not connected"
    }
  };
};

export default statusHandler;
