// @flow

import _ from "lodash";
import type { HullExternalResponse, HullIncomingHandlerMessage } from "hull";
import { ValidationError } from "hull/src/errors";
import type { HullContext, SegmentIncomingPayload } from "../types";
// const debug = require("debug")("hull-segment:segment-handler");
import events from "../events";

const camelize = message => _.mapKeys(message, (v, k) => _.camelCase(k));

module.exports = (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { client, connector, clientCredentialsToken, metric } = ctx;
  // $FlowFixMe
  if (!client || !connector) {
    throw new ValidationError(
      "missing or invalid credentials",
      "SEGMENT_INVALID_CREDENTIALS",
      400
    );
  }
  const { body } = message;
  if (!body) {
    throw new ValidationError("Empty Payload", "SEGMENT_EMPTY_CONTENT", 501);
  }
  const payload: SegmentIncomingPayload = body || {};
  const { type } = payload;
  const handler = events[type];
  client.logger.debug(`incoming.${type}.start`, {
    payload,
    clientCredentialsToken
  });
  metric.increment(`request.${type}`);
  if (!handler) {
    throw new ValidationError("Not Supported", "SEGMENT_NO_HANDLER", 501);
  }
  const { integrations = {} } = payload;
  if (integrations.Hull !== false) {
    handler(ctx, camelize(message));
  }
  return {
    status: 200,
    text: "thanks"
  };
};
