// @flow
import type { NextFunction } from "express";
import type { HullRequest, HullResponse } from "../types";
import getBody from "../utils/get-json-body";

const NotificationValidator = require("../utils/notification-validator");

function getTimestamp() {
  return Math.floor(new Date().getTime() / 1000);
}

function ensureRequestId(req: HullRequest) {
  const { hull } = req;

  // TODO: How to standardize req.body responses (again)
  // $FlowFixMe
  const { notification_id = null } = getBody(req);
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
  return function credentialsFromNotificationMiddleware(
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

    return (() =>
      skipSignatureValidation
        ? new Promise.resolve()
        : notificationValidator.validateSignature(req))()
      .then(() => {
        if (body === null || typeof body !== "object") {
          throw new Error("Missing Payload Body");
        }
        const { configuration: clientCredentials = {} } = body;
        req.hull = Object.assign(req.hull, {
          requestId: ensureRequestId(req),
          // TODO: How to standardize req.body responses (again)
          // $FlowFixMe
          clientCredentials
        });
        return next();
      })
      .catch(error => next(error));
  };
}

module.exports = credentialsFromNotificationMiddlewareFactory;
