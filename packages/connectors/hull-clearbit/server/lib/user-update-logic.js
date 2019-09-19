// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import _ from "lodash";
import type Clearbit from "../clearbit";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";
import { shouldReveal } from "../clearbit/reveal";
import { shouldEnrichUser } from "../clearbit/enrich";

export default async function userUpdateLogic(
  ctx: HullContext,
  clearbit: Clearbit
) {
  const settings: ClearbitPrivateSettings = ctx.connector.private_settings;
  return async function updateLogic(message: HullUserUpdateMessage) {
    const actions = await Promise.all([
      shouldReveal(ctx, settings, message),
      shouldEnrichUser(ctx, settings, message)
    ]);
    const [enrichAction, revealAction]: [ShouldAction, ShouldAction] = actions;

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      enrichAction.should && clearbit.enrich(message),
      revealAction.should && clearbit.reveal(message)
    ]);

    return _.filter(actions, "should")
      .map(({ message }) => ({
        action: "skip",
        message
      }))
      .concat(results);
  };
}
