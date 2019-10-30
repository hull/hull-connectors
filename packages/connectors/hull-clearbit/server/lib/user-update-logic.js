// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import _ from "lodash";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitConnectorSettings
} from "../types";
import { reveal, shouldReveal } from "../clearbit/reveal";
import { enrich, shouldEnrichUser } from "../clearbit/enrich";

export default async function userUpdateLogic(ctx: HullContext) {
  const settings: ClearbitConnectorSettings = ctx.connector.private_settings;
  return async function updateLogic(message: HullUserUpdateMessage) {
    const actions = await Promise.all([
      shouldReveal(ctx, settings, message),
      shouldEnrichUser(ctx, settings, message)
    ]);
    const [enrichAction, revealAction]: [ShouldAction, ShouldAction] = actions;

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      enrichAction.should && enrich(ctx, message),
      revealAction.should && reveal(ctx, message)
    ]);

    return _.filter(actions, "should")
      .map(({ message: msg }) => ({
        action: "skip",
        message: msg
      }))
      .concat(results);
  };
}
