// @flow

import type { HullContext, HullIncomingHandlerMessage } from "hull";

const FacebookAudience = require("../lib/facebook-audience");

async function triggerExtract(
  ctx: HullContext,
  _message: HullIncomingHandlerMessage
) {
  const { connector, client, helpers, usersSegments, metric, options } = ctx;
  const { segment_id } = options;
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
        message: "Missing credentials for trigger extract"
      }
    };
  }

  if (!segment_id) {
    return {
      status: 400,
      data: {
        message: "Missing segment id in query for trigger extract"
      }
    };
  }
  try {
    await handler.triggerExtractJob(segment_id);
  } catch (error) {
    return {
      status: 500,
      error,
      data: {
        message: "Error during trigger extract job"
      }
    };
  }
  return {
    status: 200,
    data: {
      message: "ok"
    }
  };
}

module.exports = triggerExtract;
