// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitConnectorSettings
} from "../types";
import { reveal, shouldReveal } from "../clearbit/reveal";
import { enrich, shouldEnrichUser } from "../clearbit/enrich";

const debug = require("debug")("hull-clearbit:user-update-logic");

type UserUpdateResponse = {
  revealAction: {},
  enrichAction: {},
  user_id: string,
  revealResult?: any,
  enrichResult?: any
};
export default function userUpdateLogic(ctx: HullContext) {
  const settings: ClearbitConnectorSettings = ctx.connector.private_settings;
  return async function updateLogic(
    message: HullUserUpdateMessage
  ): Promise<UserUpdateResponse> {
    const actions = await Promise.all([
      shouldReveal(ctx, settings, message),
      shouldEnrichUser(ctx, settings, message)
    ]);

    debug("User Update Logic Actions", actions);

    const [revealAction, enrichAction]: [ShouldAction, ShouldAction] = actions;

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      revealAction.should && reveal(ctx, message),
      enrichAction.should && enrich(ctx, message)
    ]);
    return {
      user_id: message.user.id,
      revealAction,
      enrichAction,
      revealResult: results[0],
      enrichResult: results[1]
    };
  };
}
