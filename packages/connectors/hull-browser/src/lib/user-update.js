// @flow
/* eslint-disable no-eval */

import get from "lodash/get";
import { EventEmitter2 as EventEmitter } from "eventemitter2";
import type { PublicPayload, PublicUpdate } from "../../types";

type UserUpdateParams = {
  emitter: typeof EventEmitter,
  debug: (string, any) => void,
  payload: PublicPayload,
  changes: any
};

export default function({
  emitter,
  debug,
  payload,
  changes
}: UserUpdateParams) {
  if (get(payload, "user.id")) {
    const {
      user = {},
      events = [],
      account = {},
      user_segments = [],
      account_segments = [],
      settings
    } = payload;
    const update: PublicUpdate = {
      ...payload,
      changes
    };

    debug("emitting user.update", update);
    emitter.emit("user.update", update);

    eval(
      `!(function(user, segments, account, account_segments, events, changes){ ${
        settings.script
      } })(${JSON.stringify(user)}, ${JSON.stringify(
        user_segments
      )}, ${JSON.stringify(account)}, ${JSON.stringify(
        account_segments
      )}, ${JSON.stringify(events)}, ${JSON.stringify(changes)})`
    );
  }
}
