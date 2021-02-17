/* @flow */
import type {
  HullContext,
  HullNotificationResponse,
  HullUserUpdateMessage
} from "hull";

const _ = require("lodash");
const { deduplicateMessages } = require("../lib/utils/dedupe-messages");
const { filterMessagesBySegments } = require("../lib/utils/filter-messages");
const PurpleFusionRouter = require("../lib/purple-fusion-router");

export default async (
  ctx: HullContext,
  messages: Array<HullUserUpdateMessage>
): HullNotificationResponse => {
  const privateSettings = ctx.connector.private_settings;

  if (
    !_.get(privateSettings, "instance_url") ||
    !_.get(privateSettings, "access_token") ||
    !_.get(privateSettings, "refresh_token")
  ) {
    ctx.client.logger.info("outgoing.job.skip", {
      jobName: "Outgoing User",
      reason: "Connector is not or not properly authenticated."
    });
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  }

  const filteredMessages = deduplicateMessages(messages, "user");

  const batchPolicy = _.get(privateSettings, "batch_policy", "strict");
  const synchronizedUserSegments = _.get(
    privateSettings,
    "contact_synchronized_segments",
    []
  );
  const synchronizedLeadSegments = _.get(
    privateSettings,
    "lead_synchronized_segments",
    []
  );

  const isBatch = _.get(ctx.notification, "is_export", false);

  let userMessages = filterMessagesBySegments(
    filteredMessages,
    synchronizedUserSegments
  );
  let leadMessages = filterMessagesBySegments(
    filteredMessages,
    synchronizedLeadSegments
  );

  userMessages = _.difference(userMessages, leadMessages);

  if (isBatch && batchPolicy === "defaultToLead") {
    const filteredOutMessages = _.difference(
      messages,
      _.concat(userMessages, leadMessages)
    );
    leadMessages = _.concat(leadMessages, filteredOutMessages);
  }

  const userRoute = "userUpdate";
  const leadRoute = "leadUpdate";
  const router = new PurpleFusionRouter();
  try {
    await Promise.all([
      router.invokeOutgoingRoute(ctx, userMessages, userRoute),
      router.invokeOutgoingRoute(ctx, leadMessages, leadRoute)
    ]);
    return {
      status: 200,
      data: {
        status: "ok"
      }
    };
  } catch (err) {
    return {
      flow_control: { type: "retry" }
    };
  }
};
