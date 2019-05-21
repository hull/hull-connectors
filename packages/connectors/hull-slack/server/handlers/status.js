// @flow
import type {
  HullContext,
  HullIncomingHandlerMessage,
  HullStatusResponse
} from "hull";
import type { ConnectSlackFunction } from "../types";

const statusHandler = (connectSlack: ConnectSlackFunction) => async (
  ctx: HullContext,
  _incomingMessages: HullIncomingHandlerMessage
): HullStatusResponse => {
  const { connector, client } = ctx;
  const { private_settings } = connector;
  const { oauth = {}, notify_events = [] } = private_settings;
  const {
    token,
    team_id,
    user_id,
    bot: { bot_user_id, bot_access_token } = {}
  } = oauth;
  try {
    if (!token || !bot_access_token) {
      return {
        status: "setupRequired",
        messages: [
          'Credentials are empty, Token isn\'t present, please authorize the app by clicking "Credentials & Actions"'
        ]
      };
    }

    if (!team_id || !user_id || !bot_user_id) {
      return {
        status: "setupRequired",
        messages: [
          "Authentication isn't properly setup. please re-authorize the app"
        ]
      };
    }

    await connectSlack(ctx);

    if (!notify_events.length) {
      return {
        status: "warning",
        messages: [
          "Connector has no triggers saved. No notifications will be sent"
        ]
      };
    }

    return {
      status: "ok",
      messages: ["Connected to slack"]
    };
  } catch (err) {
    client.logger.info("oauth.setupTest.failed", {
      error: err.message
    });
    return {
      status: "error",
      messages: ["Can't Connect"]
    };
  }
};

export default statusHandler;
