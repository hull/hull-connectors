// @flow

import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

import userUpdate from "../lib/user-update";

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>,
  { queued = false, attempt = 1, isBatch = false }: any = {}
): HullNotificationResponse => {
  return userUpdate(ctx, messages, { queued, attempt, isBatch });
};
