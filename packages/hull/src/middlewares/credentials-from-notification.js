// @flow
import type { $Response, NextFunction } from "express";
import type { HullRequestBase } from "../types";

const debug = require("debug")("hull-connector:credentials-from-notification");
const bodyParser = require("body-parser");
const NotificationValidator = require("../utils/notification-validator");

function getTimestamp() {
  return Math.floor(new Date().getTime() / 1000);
}

function ensureRequestId(req) {
  const { hull, body } = req;
  const { notification_id } = body;
  if (hull.requestId) return hull.requestId;
  if (notification_id) {
    return ["smart-notifier", getTimestamp(), notification_id].join(":");
  }
}

/**
 * This middleware is responsible for parsing incoming notification, validating it
 * and extracting credentials out of it.
 * As a result it sets `req.hull.clientCredentials`.
 */
function credentialsFromNotificationMiddlewareFactory() {
  return function credentialsFromNotificationMiddleware(
    req: HullRequestBase,
    res: $Response,
    next: NextFunction
  ) {
    const { hull, body } = req;

    const {
      skipSignatureValidation,
      notificationValidatorHttpClient
    } = hull.connectorConfig;
    const notificationValidator = new NotificationValidator(
      notificationValidatorHttpClient
    );

    if (!skipSignatureValidation) {
      const headersError = notificationValidator.validateHeaders(req);
      if (headersError) {
        return next(headersError);
      }
    }

    const payloadError = notificationValidator.validatePayload(req);
    if (payloadError !== null) {
      return next(payloadError);
    }

    return (() =>
      skipSignatureValidation
        ? new Promise.resolve()
        : notificationValidator.validateSignature(req))()
      .then(() => {
        if (body === null || typeof body !== "object") {
          throw new Error("Missing Payload Body");
        }
        const { configuration: clientCredentials } = body;
        req.hull = Object.assign(req.hull, {
          requestId: ensureRequestId(req),
          clientCredentials
        });
        return next();
      })
      .catch(error => next(error));
  };
}

module.exports = credentialsFromNotificationMiddlewareFactory;
