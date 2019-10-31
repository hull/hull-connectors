// @flow
import _ from "lodash";
import type { HullContext, HullAccountUpdateMessage } from "hull";
import type {
  ShouldAction,
  ClearbitResult,
  ClearbitConnectorSettings
} from "../types";
import { prospect, shouldProspect } from "../clearbit/prospect";
import { enrich, shouldEnrichAccount } from "../clearbit/enrich";

const debug = require("debug")("hull-clearbit:account-update-logic");

export default async function updateLogic(ctx: HullContext) {
  const settings: ClearbitConnectorSettings = ctx.connector.private_settings;
  return async function accountUpdateLogic(message: HullAccountUpdateMessage) {
    const actions = await Promise.all([
      shouldEnrichAccount(ctx, settings, message),
      shouldProspect(ctx, settings, message)
    ]);

    const [enrichAction, prospectActions]: [
      ShouldAction,
      ShouldAction
    ] = actions;

    debug("Account Update Logic Actions", actions);

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      enrichAction.should && enrich(ctx, message),
      prospectActions.should && prospect(ctx, message)
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
