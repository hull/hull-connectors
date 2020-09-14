// @flow
import type { HullContext, HullEvent } from "hull";

import _ from "lodash";
import varsFromSettings from "./vars-from-settings";
import getSample from "./get-sample";
import getClaims from "./get-claims";

const EXCLUDED_EVENTS = [
  "Attributes changed",
  "Entered segment",
  "Left segment",
  "Segments changed"
];

export const isVisible = ({ event }: HullEvent) =>
  !_.includes(EXCLUDED_EVENTS, event);

export default function formatPayload(ctx: HullContext, { entity, message }) {
  const { group } = ctx.client.utils.traits;
  const isUser = entity === "user";
  const { user, account = {}, events = [] } = message;
  const userPayload =
    events && user && isUser
      ? {
          user: group(user),
          changes: getSample(user),
          events: events.filter(isVisible)
        }
      : {};
  return {
    payload: {
      ...message,
      variables: varsFromSettings(ctx),
      account: group(account),
      changes: getSample(account),
      ...userPayload
    },
    claims: getClaims(isUser ? "user" : "account", message)
  };
}
