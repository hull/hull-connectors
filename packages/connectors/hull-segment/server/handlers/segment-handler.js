// @flow

import _ from "lodash";
import type { HullContext, HullIncomingHandlerMessage } from "hull";
import handlers from "../events";

const camelize = str => {
  const ret = str.replace(/[-_\s]+(.)?/g, (match, c) =>
    c ? c.toUpperCase() : ""
  );
  return ret.charAt(0).toLowerCase() + ret.slice(1);
};

const camelizeObjectKeys = message =>
  _.reduce(
    message,
    (m, v, k) => {
      const camelK = camelize(k);
      m[camelK] = message[camelK] || message[k];
      return m;
    },
    {}
  );

export default async function segmentHandler(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { client, metric } = ctx;
  const { body } = message;
  try {
    const eventName = body.type;
    client.logger.debug(`incoming.${eventName}.start`, message.body);
    metric.increment(`request.${eventName}`);

    const handler = handlers[eventName];

    if (!handler) {
      const err = new Error("Not Supported");
      err.status = 501;
      throw err;
    }

    // Don't process if hull integrations explicitely disabled
    if (body?.integrations?.Hull !== false) {
      try {
        await handler(ctx, camelizeObjectKeys(body));
      } catch (err) {
        // fix https://sentry.io/hull-dev/hull-segment/issues/415436300/
        if (_.isString(err)) {
          const error = new Error(err);
          error.status = 500;
          throw error;
        }
        err.status = (err && err.status) || 500;
        throw err;
      }
    }

    return {
      status: 200,
      text: "thanks"
    };
  } catch (err) {
    const data = {
      status: err.status,
      ..._.pick(message, ["body", "method", "headers", "url", "params"])
    };
    if (err.status === 500) {
      data.stack = err.stack;
    }
    client.logger.error("incoming.bogus.error", data);
    return {
      status: err.status,
      text: err.message
    };
  }
}
