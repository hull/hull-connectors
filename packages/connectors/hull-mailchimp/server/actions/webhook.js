/* @flow */
import type { HullContext, HullIncomingHandlerMessage } from "hull";

const _ = require("lodash");

const shipAppFactory = require("../lib/ship-app-factory");

async function handleAction(
  ctx: HullContext,
  message: HullIncomingHandlerMessage
) {
  const { syncAgent } = shipAppFactory(ctx);
  const { client } = ctx;
  const { body, method = "" } = message;
  if (!body) {
    return {
      statusCode: 404,
      data: {
        ok: false,
        message: "Body isn't a valid object"
      }
    };
  }
  // $FlowFixMe
  const { type = "", data = {} } = body;

  if (method.toLowerCase() === "get") {
    return {
      statusCode: 200,
      data: { ok: true, message: "Webhook registered" }
    };
  }

  client.logger.debug("incoming.webhook.received", { type, data });

  if (!data || !data.email) {
    return {
      statusCode: 404,
      data: { ok: false, message: "Email not found" }
    };
  }
  let processedData = _.cloneDeep(data);
  switch (
    type // eslint-disable-line default-case
  ) {
    case "profile":
      break;

    case "subscribe":
      processedData = _.merge({}, data, {
        status: "subscribed",
        subscribed: true
      });
      break;

    case "unsubscribe":
      processedData = _.merge({}, data, {
        status: "unsubscribed",
        subscribed: false
      });
      break;

    case "cleaned":
      processedData = _.merge({}, data, {
        status: "cleaned",
        value: false
      });
      break;
    default:
  }
  await syncAgent.userMappingAgent.updateUser(processedData);

  return {
    statusCode: 200,
    data: { ok: true, message: "Data processed" }
  };
}

module.exports = handleAction;
