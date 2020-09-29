// @flow
import type { HullReqContext, HullUserUpdateMessage } from "hull";

const _ = require("lodash");

const FacebookAudience = require("../lib/facebook-audience");

function userUpdateSmartNotifier(
  ctx: HullReqContext,
  messages: Array<HullUserUpdateMessage>
): Promise<*> {
  const {
    client,
    connector,
    helpers,
    usersSegments,
    metric,
    smartNotifierResponse
  } = ctx;
  const { private_settings } = connector;
  if (smartNotifierResponse) {
    smartNotifierResponse.setFlowControl({
      type: "next",
      size: 100,
      in: 10
    });
  }

  const handler = new FacebookAudience(
    connector,
    client,
    helpers,
    usersSegments,
    metric
  );
  if (!handler.isConfigured()) {
    return {
      status: 403,
      data: {
        message: "Missing credentials, skipping"
      }
    };
  }

  if (
    !private_settings.synchronized_segments_mapping ||
    private_settings.synchronized_segments_mapping.length === 0
  ) {
    client.logger.debug("outgoing.user.skip", {
      reason: "segments mapping doesn't contain any filtered segment"
    });
    return {
      status: 200
    };
  }

  const filteredMessages = messages.reduce((acc, message) => {
    const { user, changes } = message;
    const asUser = client.asUser(_.pick(user, "id", "external_id", "email"));

    // Ignore if no changes on users' segments
    if (!changes || _.isEmpty(changes.segments)) {
      asUser.logger.debug("outgoing.user.skip", {
        reason: "no changes on users segments"
      });
      return acc;
    }

    // Reduce payload to keep in memory
    const payload = {
      user: _.pick(
        user,
        handler.customAudiences.getExtractFields(),
        "id",
        "external_id",
        "email"
      ),
      changes: _.pick(changes, "segments")
    };

    return acc.concat(payload);
  }, []);

  return filteredMessages.length === 0
    ? { status: 200 }
    : FacebookAudience.flushUserUpdates(handler, filteredMessages);
}

module.exports = userUpdateSmartNotifier;
