// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import _ from "lodash";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";
import type Clearbit from "../clearbit";
// import { shouldProspect, shouldProspectDomain, prospect } from "./prospect";
import {
  shouldProspect,
  shouldProspectDomain,
  prospect
} from "../clearbit/prospect";
import { shouldReveal, reveal } from "../clearbit/reveal";
import { shouldEnrich, enrich } from "../clearbit/enrich";
import { shouldDiscover, discover } from "../clearbit/discover";

// import { shouldDiscover, discover } from "./discover";
// import { shouldReveal, reveal } from "./reveal";

export default async function userUpdateLogic(
  ctx: HullContext,
  clearbit: Clearbit
) {
  const settings: ClearbitPrivateSettings = ctx.connector.private_settings;
  return async function updateLogic(msg: HullUserUpdateMessage) {
    const actions = await Promise.all([
      shouldReveal(settings, msg),
      shouldEnrich(settings, msg)
    ]);
    const [enrichAction, revealAction] = actions;

    const results = await Promise.all([
      enrichAction.should && clearbit.enrich(msg),
      revealAction.should && clearbit.reveal(msg)
    ]);

    return _.filter(actions, "should")
      .map(({ message }) => ({
        action: "skip",
        message
      }))
      .concat(results);
  };
}
