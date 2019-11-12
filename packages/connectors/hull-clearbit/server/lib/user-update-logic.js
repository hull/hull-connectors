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

export default function userUpdateLogic(ctx: HullContext) {
  const settings: ClearbitConnectorSettings = ctx.connector.private_settings;
  return async function updateLogic(
    message: HullUserUpdateMessage
  ): Promise<Array<{ action: string, msg: string }>> {
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

    return actions
      .filter(s => s.should)
      .map(({ message: msg }) => ({
        action: "skip",
        message: msg
      }))
      .concat(results);
  };
}
