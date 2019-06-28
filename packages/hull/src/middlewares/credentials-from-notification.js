// @flow
import type { NextFunction } from "express";
import type {
  HullRequest,
  HullResponse,
  HullClientCredentials
} from "../types";
import getBody from "../utils/get-json-body";

const NotificationValidator = require("../utils/notification-validator");

function getTimestamp() {
  return Math.floor(new Date().getTime() / 1000);
}

function ensureRequestId(req: HullRequest) {
  const { hull } = req;
  const { notification_id = null } = getBody(req.body);

  if (hull.requestId) return hull.requestId;
  if (notification_id) {
    return ["smart-notifier", getTimestamp(), notification_id].join(":");
  }
  return undefined;
}

/**
 * This middleware is responsible for parsing incoming notification, validating it
 * and extracting credentials out of it.
 * As a result it sets `req.hull.clientCredentials`.
 */
function credentialsFromNotificationMiddlewareFactory() {
  return async function credentialsFromNotificationMiddleware(
    req: HullRequest,
    res: HullResponse,
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
    try {
      await (skipSignatureValidation
        ? Promise.resolve()
        : notificationValidator.validateSignature(req));
      if (body === null || typeof body !== "object") {
        throw new Error("Missing Payload Body");
      }
      const {
        configuration: clientCredentials = {}
      }: {
        configuration: HullClientCredentials
      } = body;
      req.hull = Object.assign(req.hull, {
        requestId: ensureRequestId(req),
        clientCredentials
      });
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
module.exports = credentialsFromNotificationMiddlewareFactory;
