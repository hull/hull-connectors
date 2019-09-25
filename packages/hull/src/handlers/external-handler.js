// @flow
import type { NextFunction } from "express";
import type {
  HullIncomingHandlerConfigurationEntry,
  HullRequest,
  HullExternalResponseData,
  HullResponse
} from "../types";
import getMessage from "../utils/get-message-from-request";

const debug = require("debug")("hull-connector:external-handler");

const handlerFactory = ({
  options = {},
  callback
}: HullIncomingHandlerConfigurationEntry) => async (
  req: HullRequest,
  res: HullResponse,
  next: NextFunction
) => {
  try {
    const {
      fireAndForget = false,
      cache = {},
      format = "json",
      dropIfConnectorDisabled = false
    } = options;
    const { key, options: cacheOpts = {} } = cache;
    const message = getMessage(req);

    try {
      if (
        dropIfConnectorDisabled &&
        !req.hull.connector.accept_incoming_webhooks
      ) {
        return res.json({
          message: "Connector is paused, skipped"
        });
      }
    } catch (unknownError) {
      debug("unknown error when trying to drop incoming request");
    }

    // Immediately respond to service
    if (fireAndForget === true) {
      res.json({ status: "deferred" });
    }

    // Perform operation
    debug("callback start");

    // Cache or perform uncached call;
    const response: void | HullExternalResponseData = await (key
      ? req.hull.cache.wrap(
          key,
          () => callback(req.hull, message, res),
          cacheOpts
        )
      : Promise.resolve(callback(req.hull, message, res)));

    debug("callback response", response);

    // Early return if we responded already
    if (res.headersSent) {
      return res;
    }

    // Early return without sending a response if fireAndForget
    // We already sent it above
    if (fireAndForget === true) {
      return res;
    }

    // Early return if we don't have a response;
    if (!response) {
      res.sendStatus(200);
      return res.end("ok");
    }

    // There'a an actual Response to send
    const { pageLocation, data, status = 200, text } = response;
    if (!status && !data && !text && !pageLocation) {
      throw new Error(
        "Malformed response, missing content to conform to HullExternalResponse"
      );
    }

    // Set the response status
    debug("sending status", status);
    res.status(status);

    // For HTML middlewares, force a html rendering or error out.
    if (format === "html") {
      if (!pageLocation) {
        throw new Error("pageLocation required");
      }
      return res.render(pageLocation, data);
    }

    if (data !== undefined) {
      debug("sending data", data);
      // Respond with data
      return res.json(data);
    }
    if (text) {
      debug("sending text", text);
      // Respond with Text fallback
      return res.send(text);
    }
    return res.end();
  } catch (err) {
    return next(err);
  }
};

export default handlerFactory;
