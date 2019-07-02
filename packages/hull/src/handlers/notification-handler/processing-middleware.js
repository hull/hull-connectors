// @flow
import _ from "lodash";
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullNotificationHandlerConfiguration,
  HullNotificationResponse,
  HullResponse
} from "../../types";
import processHullMessage from "../process-hull-messages";
import { MissingHandlerError } from "../../errors";

const debug = require("debug")("hull-connector:notification-handler");

const { notificationDefaultFlowControl } = require("../../utils");

function notificationHandlerProcessingMiddlewareFactory(
  configuration: HullNotificationHandlerConfiguration
) {
  return async function notificationHandlerProcessingMiddleware(
    req: HullRequest,
    res: HullResponse,
    next: NextFunction
  ): mixed {
    if (!req.hull.notification) {
      return next(new Error("Missing Notification payload"));
    }
    const {
      channel,
      segments: user_segments,
      accounts_segments: account_segments,
      connector,
      messages = []
    } = req.hull.notification;
    debug("notification", {
      channel,
      messages: Array.isArray(messages) && messages.length
    });

    // const handlers = _.filter(configuration, { channel });
    try {
      // For now we only support one flow control return from there.
      // Force using the first handler. ignore the others.
      const handler = _.find(configuration, { channel });
      if (!handler) {
        throw new MissingHandlerError(
          `Missing handler for this channel: ${channel}`
        );
      }
      const { options = {}, callback } = handler;
      const defaultSuccessFlowControl = notificationDefaultFlowControl(
        req.hull,
        channel,
        "success"
      );
      req.hull.isBatch = req.hull.notification.is_export || false;
      const process = processHullMessage({
        segments: {
          user_segments,
          account_segments
        },
        channel,
        connector,
        options,
        isBatch: false
      });
      const msg =
        channel === "user:update" || channel === "account:update"
          ? process(messages)
          : messages;
      // $FlowFixMe
      const response: HullNotificationResponse = await callback(req.hull, msg);
      const { flow_control = defaultSuccessFlowControl } = response || {};
      return res.status(200).json({ flow_control });
      // return await Promise.all(
      //   handlers.map(async ({ options = {}, callback }) => {
      //
      //   })
      // );
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = notificationHandlerProcessingMiddlewareFactory;
