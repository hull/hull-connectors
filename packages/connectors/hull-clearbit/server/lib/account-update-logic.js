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

type AccountUpdateResponse = {
  prospectAction: {},
  enrichAction: {},
  account_id?: string,
  prospectResult?: any,
  enrichResult?: any
};

export default function updateLogic(ctx: HullContext) {
  const settings: ClearbitConnectorSettings = ctx.connector.private_settings;
  return async function accountUpdateLogic(
    message: HullAccountUpdateMessage
  ): Promise<AccountUpdateResponse> {
    const actions = await Promise.all([
      shouldEnrichAccount(ctx, settings, message),
      shouldProspect(ctx, settings, message)
    ]);

    const [enrichAction, prospectAction]: [
      ShouldAction,
      ShouldAction
    ] = actions;

    debug("Account Update Logic Actions", actions);

    const results: Array<void | false | ClearbitResult> = await Promise.all([
      enrichAction.should && enrich(ctx, message),
      prospectAction.should && prospect(ctx, message)
    ]);

    return {
      account_id: message.account.id,
      enrichAction,
      prospectAction,
      enrichResult: results[0],
      prospectResult: results[1]
    };
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
  };
}
