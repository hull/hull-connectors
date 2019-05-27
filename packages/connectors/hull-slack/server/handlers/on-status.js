// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullSettingsResponse
} from "hull";
import type { ConnectSlackFunction } from "../types";

const onStatus = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullSettingsResponse => {
  await connectSlack(ctx);
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

export default onStatus;
