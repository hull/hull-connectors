// @flow

import type {
  HullContext,
  HullAccountSegmentUpdateMessage,
  HullNotificationResponse
} from "hull";
import _ from "lodash";
import SyncAgent from "../lib/sync-agent";

export default async (
  ctx: HullContext,
  messages: Array<HullAccountSegmentUpdateMessage>
): HullNotificationResponse => {
  try {
    // FIXME: due to the fact the segments lists may be or may not be updated we need
    // to make sure that we have the new segment there
    ctx.accountsSegments = _.uniqBy(
      ctx.accountsSegments.concat(messages),
      "id"
    );
    const syncAgent = new SyncAgent(ctx);
    await syncAgent.syncConnector();
    return {
      flow_control: { type: "next", size: 1, in: 1 }
    };
  } catch (err) {
    return {};
  }
};
