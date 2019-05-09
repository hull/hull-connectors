// @flow

import _ from "lodash";
import type {
  HullContext,
  HullAccountUpdateMessage,
  HullAccountUpdateHandlerCallback,
  HullNotificationResponse,
  HullMessageResponse
} from "hull";
import type {
  SegmentClientFactory,
  SegmentContext,
  SegmentConnector
} from "../types";
import { getfirstNonNull, getFirstAnonymousIdFromEvents } from "../lib/utils";

// import { notificationDefaultFlowControl } from "hull/lib/utils";

const context = { active: false, ip: 0 };
const integrations = { Hull: false };

function update(
  analyticsClient,
  { connector, metric, client, isBatch }: HullContext<SegmentConnector>,
  message: HullAccountUpdateMessage
): HullMessageResponse | void {
  const { settings = {}, private_settings = {} } = connector;
  const { account, account_segments } = message;

  // Empty payload ?
  if (!account.id) {
    return;
  }

  const asAccount = client.asAccount(account);

  const {
    synchronized_account_properties = [],
    synchronized_account_segments = [],
    send_events = []
  } = private_settings;

  const {
    write_key,
    handle_accounts,
    public_id_field,
    public_account_id_field = "external_id"
  } = settings;

  if (!write_key) {
    return;
  }

  const analytics = analyticsClient(write_key);
  const anonymousId = getfirstNonNull(account.anonymous_ids);
  const accountId: ?string = account && account[public_account_id_field];
  const segmentIds = _.map(account_segments, "id");

  // We have no identifier for the user, we have to skip
  if (!accountId) {
    return {
      action: "skip",
      message: "No account ID available. Segment requires one",
      id: account.id,
      type: "account",
      data: { anonymousId, accountId, public_account_id_field }
    };
  }

  //Process everyone when in batch mode.
  if (
    !isBatch &&
    !_.size(_.intersection(segmentIds, synchronized_account_segments))
  ) {
    return {
      action: "skip",
      message: "Not matching any segment",
      id: account.id,
      type: "account",
      data: { anonymousId, accountId, segmentIds }
    };
  }

  const traits = _.reduce(
    synchronized_account_properties.map(k => k.replace(/^account\./, "")),
    (traits, attribute) => {
      traits[attribute.replace("/", "_")] = account[attribute];
      return traits;
    },
    {
      hull_segments: _.map(account_segments, "name")
    }
  );

  analytics.group({
    group: accountId,
    traits,
    context,
    integrations
  });
  metric.increment("ship.service_api.call", 1, ["type:group"]);
  asAccount.logger.info("outgoimg.account.success", { traits });
  return {
    action: "success",
    id: account.id,
    type: "account",
    data: { traits }
  }
}

module.exports = (
  analyticsClient: SegmentClientFactory
): HullAccountUpdateHandlerCallback => (
  ctx: HullContext<SegmentConnector>,
  messages: Array<HullAccountUpdateMessage>
): HullNotificationResponse =>
  Promise.all(
    messages.map(message => update(analyticsClient, ctx, message))
  ).then(responses => ({
    responses: _.compact(responses),
    flow_control: {
      type: "next",
      size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100,
      in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1,
      in_time: 0
    }
  }));
// return notificationDefaultFlowControl({
//   ctx,
//   channel: "account:update",
//   result: "success" | "error" | "retry"
// })
