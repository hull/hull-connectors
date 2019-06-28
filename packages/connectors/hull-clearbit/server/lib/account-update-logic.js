import _ from "lodash";

export default function accountUpdateLogic({ message = {}, clearbit, client }) {
  const { account_segments, account } = message;
  const skips = {};

  const { should, message: enrichMessage } = clearbit.shouldEnrich(message);
  if (should) {
    clearbit.enrich(message);
  } else {
    skips.enrich = enrichMessage;
  }

  const {
    should: shouldDiscover,
    message: discoverMessage
  } = clearbit.shouldDiscover(message);

  if (shouldDiscover) {
    clearbit.discover(message);
  } else {
    skips.discover = discoverMessage;
  }

  const {
    should: shouldProspect,
    message: prospectMessage
  } = clearbit.shouldProspect({
    account_segments,
    account
  });
  if (shouldProspect) {
    clearbit.prospect(account);
  } else {
    skips.prospect = prospectMessage;
  }

  if (_.size(skips)) {
    client.asAccount(account).logger.info("outgoing.account.skip", {
      reason: "no action matched",
      ...skips
    });
    return false;
  }
  return true;
}
