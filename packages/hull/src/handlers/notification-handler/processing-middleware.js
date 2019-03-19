// @flow
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullNotificationHandlerConfiguration,
  HullNotificationResponse,
  HullResponse
} from "../../types";

const debug = require("debug")("hull-connector:notification-handler");

const {
  notificationDefaultFlowControl,
  trimTraitsPrefixFromUserMessage
} = require("../../utils");

function notificationHandlerProcessingMiddlewareFactory(
  configuration: HullNotificationHandlerConfiguration
) {
  return function notificationHandlerProcessingMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ): mixed {
    if (!req.hull.notification) {
      return next(new Error("Missing Notification payload"));
    }
    const { channel } = req.hull.notification;
    let { messages = [] } = req.hull.notification;
    debug("notification", {
      channel,
      messages: Array.isArray(messages) && messages.length
    });
    if (configuration[channel] === undefined) {
      return next(new Error("Channel unsupported"));
    }
    const { callback } = configuration[channel];

    if (channel === "user:update") {
      // $FlowFixMe
      messages = messages.map(trimTraitsPrefixFromUserMessage);
    }

    const defaultSuccessFlowControl = notificationDefaultFlowControl(
      req.hull,
      channel,
      "success"
    );
    // req.hull.notificationResponse = notificationResponse
    // $FlowFixMe
    return callback(req.hull, messages)
      .then((nResponse: HullNotificationResponse = {}) => {
        const { flow_control = defaultSuccessFlowControl } = nResponse || {};
        res.status(200).json({ flow_control });
      })
      .catch(error => next(error));
  };
}

module.exports = notificationHandlerProcessingMiddlewareFactory;
