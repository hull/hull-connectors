/* @flow */
import type { HullContext } from "hull";
import type { $Request } from "express";

const _ = require("lodash");

const shipAppFactory = require("../lib/ship-app-factory");

function handleAction(ctx: HullContext, req: $Request) {
  const { syncAgent } = shipAppFactory(ctx);
  const { body = {}, method = "" } = req;

  if (method.toLowerCase() === "get") {
    return Promise.resolve({
      statusCode: 200,
      json: { ok: true, message: "Webhook registered" }
    });
  }
  const { type, data } = body;

  req.hull.client.logger.debug("incoming.webhook.received", { type, data });

  if (!data || !data.email) {
    return Promise.resolve({
      statusCode: 404,
      json: { ok: false, message: "Email not found" }
    });
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
  return syncAgent.userMappingAgent.updateUser(processedData).then(() => {
    return {
      statusCode: 200,
      json: { ok: true, message: "Data processed" }
    };
  });
}

module.exports = handleAction;
