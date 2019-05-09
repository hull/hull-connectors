// @flow
import type { HullContext, HullStatusResponse } from "hull";

export default async function statusCheck(
  ctx: HullContext
): HullStatusResponse {
  const { connector /* , client */ } = ctx;
  const { private_settings } = connector;
  const {
    token,
    team_id,
    user_id,
    bot: { bot_user_id, bot_access_token } = {},
    notify_segments = [],
    notify_events = []
  } = private_settings;

  const messages = [];

  // const send = () => {
  //   res.json({ messages, status });
  //   return client.put(`${connector.id}/status`, { status, messages });
  // };

  if (!token) {
    messages.push(
      'Credentials are empty, Token isn\'t present, please authorize the app by clicking "Credentials & Actions"'
    );
    return { status: "warning", messages };
  }
  if (!team_id || !user_id || !bot_user_id || !bot_access_token) {
    messages.push(
      "Authentication isn't properly setup. please re-authorize the app"
    );
    return { status: "warning", messages };
  }

  if (!notify_segments.length && !notify_events.length) {
    messages.push(
      "No segments or events are set. No notifications will be sent"
    );
    return { status: "warning", messages };
  }

  return { status: "ok", messages };
}
