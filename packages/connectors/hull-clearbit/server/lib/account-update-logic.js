// @flow
import _ from "lodash";
import type { HullContext, HullAccountUpdateMessage } from "hull";
import type Clearbit from "../clearbit";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitPrivateSettings
} from "../types";
import { shouldProspect } from "../clearbit/prospect";
import { shouldEnrichAccount } from "../clearbit/enrich";

export default async function updateLogic(
  ctx: HullContext,
  clearbit: Clearbit
) {
  const settings: ClearbitPrivateSettings = ctx.connector.private_settings;
  return async function accountUpdateLogic(message: HullAccountUpdateMessage) {
    const actions = await Promise.all([
      shouldEnrichAccount(ctx, settings, message),
      shouldProspect(ctx, settings, message)
    ]);

    const [enrichAction, prospectActions]: [
      ShouldAction,
      ShouldAction
    ] = actions;

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      enrichAction.should && clearbit.enrich(message),
      prospectActions.should && clearbit.prospect(message)
    ]);

    // const {
    //   should: shouldDiscover,
    //   message: discoverMessage
    // } = clearbit.shouldDiscover(message);
    //
    // if (shouldDiscover) {
    //   clearbit.discover(message);
    // } else {
    //   skips.discover = discoverMessage;
    // }

    // const {
    //   should: shouldProspect,
    //   message: prospectMessage
    // } = clearbit.shouldProspect({
    //   account_segments,
    //   account
    // });
    // if (shouldProspect) {
    //   clearbit.prospect(account);
    // } else {
    //   skips.prospect = prospectMessage;
    // }

    return _.filter(actions, "should")
      .map(({ message }) => ({
        action: "skip",
        message
      }))
      .concat(results);
  };
}
