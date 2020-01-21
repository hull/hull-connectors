// @flow

import _ from "lodash";
import type {
  HullContext,
  HullExternalResponse,
  HullIncomingHandlerMessage
} from "hull";
import { ValidationError } from "hull/src/errors";
import type { SegmentIncomingPayload } from "../types";
// const debug = require("debug")("hull-segment:segment-handler");
import events from "../events";

const camelize = message => _.mapKeys(message, (v, k) => _.camelCase(k));

const incomingHandler = async (
  ctx: HullContext,
  message: HullIncomingHandlerMessage
): HullExternalResponse => {
  const { client, connector, metric } = ctx;
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
    return {
      status: 500,
      data: { message: "Empty Payload" }
    };
    // throw new ValidationError("Empty Payload", "SEGMENT_EMPTY_CONTENT", 501);
  }
  // $FlowFixMe
  const payload: SegmentIncomingPayload = body || {};
  const { type } = payload;

  if (!type) {
    metric.increment("request.error");
    client.logger.debug("incoming.request.error", {
      message: "Can't find Type in Payload",
      payload
    });
    return {
      status: 501,
      data: {
        message: "Not Supported"
      }
    };
  }

  const handler = events[type];
  if (!handler) {
    metric.increment("request.error");
    client.logger.debug(`incoming.${type}.error`, { payload });
    return {
      status: 501,
      data: { message: "Not Supported" }
    };
  }

  metric.increment(`request.${type}`);
  client.logger.debug(`incoming.${type}.start`, { payload });
  const { integrations = {} } = payload;
  // TODO: response 429 - too many requests. Can we measure requests in flight ?
  try {
    if (integrations.Hull !== false) {
      await handler(ctx, camelize(body));
    }
  } catch (e) {
    return {
      status: 500,
      data: { message: e.message }
    };
  }
  return {
    status: 200,
    data: { message: "thanks" }
  };
};
export default incomingHandler;
