// @flow
import type { HullContext, HullUserUpdateMessage } from "hull";
import _ from "lodash";
import type { SegmentContext } from "../../types";

const segmentContext: SegmentContext = { active: false, ip: 0 };
const integrations = { Hull: false };

const accountUpdate = (ctx: HullContext, analytics: any) => async (
  message: HullUserUpdateMessage,
  userId?: string | void | null,
  anonymousId?: string | void | null
): any => {
  const { client, connector, metric, isBatch } = ctx;
  const { settings = {}, private_settings = {} } = connector;
  const {
    synchronized_account_segments = [],
    synchronized_account_properties = []
  } = private_settings;
  const { handle_accounts, public_account_id_field } = settings;
  const { account, account_segments } = message;
  // Empty payload ?
  if (!account || !account.id || !connector.id) {
    return undefined;
  }

  // Group calls disabled
  if (!handle_accounts) {
    return undefined;
  }

  // We do the check here since we're not relying on Account update messages but User update messages instead - so Kraken filtering can't help us
  if (
    !isBatch &&
    !_.includes(synchronized_account_segments, "ALL") &&
    !_.intersection(
      _.map(account_segments, "id"),
      synchronized_account_segments
    )
  ) {
    return undefined;
  }
  // Look for an anonymousId
  // if we have events in the payload, we take the annymousId of the first event
  // Otherwise, we look for known anonymousIds attached to the user and we take the first one
  // const anonymousId = getfirstNonNull(account.anonymous_ids);
  const groupId: ?string = _.get(account, public_account_id_field);
  const asAccount = client.asAccount(account);

  // We have no identifier for the user, we have to skip
  if (!groupId || (!anonymousId && !userId)) {
    return asAccount.logger.info("outgoing.account.skip", {
      message: "No Identifier available",
      anonymousId,
      groupId,
      public_account_id_field,
      anonymousIds: account.anonymous_ids
    });
  }

  const traits = _.reduce(
    synchronized_account_properties.map(k => k.replace(/^account\./, "")),
    (tt, attribute) => {
      tt[attribute.replace("/", "_")] = account[attribute];
      return tt;
    },
    {
      hull_segments: _.map(account_segments, "name")
    }
  );

  try {
    const payload = {
      groupId,
      traits,
      context: segmentContext,
      integrations
    };
    await analytics.group(
      userId
        ? {
            userId,
            ...payload
          }
        : {
            anonymousId,
            ...payload
          }
    );
    metric.increment("ship.service_api.call", 1, ["type:group"]);
    return undefined;
  } catch (err) {
    err.reason = "Error sending Account to Segment";
    throw err;
  }
};

export default accountUpdate;
