/* @flow */
// import type { $Request } from "express";
import type { HullRequest } from "../types";

const Promise = require("bluebird");
const requestClient = require("request");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

const { NotificationValidationError } = require("../errors");

const certCache = {};
const supportedSignaturesVersions = ["v1"];

class NotificationValidator {
  httpClient: requestClient;

  constructor(httpClient: requestClient = null) {
    if (!httpClient) {
      this.httpClient = requestClient;
    } else {
      this.httpClient = httpClient;
    }
  }

  validateHeaders(req: HullRequest): NotificationValidationError | null {
    if (!this.hasFlagHeader(req)) {
      return new NotificationValidationError(
        "Missing flag header",
        "MISSING_FLAG_HEADER"
      );
    }

    if (!this.validateSignatureVersion(req)) {
      return new NotificationValidationError(
        "Unsupported signature version",
        "UNSUPPORTED_SIGNATURE_VERSION"
      );
    }

    if (!this.validateSignatureHeaders(req)) {
      return new NotificationValidationError(
        "Missing signature header(s)",
        "MISSING_SIGNATURE_HEADERS"
      );
    }

    return null;
  }

  hasFlagHeader(req: HullRequest): boolean {
    return _.has(req.headers, "x-hull-smart-notifier");
  }

  validatePayload(req: HullRequest): NotificationValidationError | null {
    if (!req.body) {
      return new NotificationValidationError(
        "No notification payload",
        "MISSING_NOTIFICATION_PAYLOAD"
      );
    }

    if (!req.body.configuration) {
      return new NotificationValidationError(
        "No configuration in payload",
        "MISSING_CONFIGURATION"
      );
    }
    return null;
  }

  validateSignatureVersion(req: HullRequest): boolean {
    return (
      _.has(req.headers, "x-hull-smart-notifier-signature-version") &&
      _.indexOf(
        supportedSignaturesVersions,
        req.headers["x-hull-smart-notifier-signature-version"]
      ) >= 0
    );
  }

  validateSignatureHeaders(req: HullRequest): boolean {
    return [
      "x-hull-smart-notifier-signature",
      "x-hull-smart-notifier-signature-version",
      "x-hull-smart-notifier-signature-public-key-url"
    ].every(h => _.has(req.headers, h));
  }

  async validateSignature(req: HullRequest): Promise {
    try {
      const certificate = await this.getCertificate(req);
      const decoded = jwt.verify(
        req.headers["x-hull-smart-notifier-signature"],
        certificate,
        {
          algorithms: ["RS256"],
          jwtid: (req.body && req.body.notification_id) || ""
        }
      );
      if (!decoded) {
        throw new NotificationValidationError(
          "Signature invalid",
          "INVALID_SIGNATURE"
        );
      }
      return null;
    } catch (error) {
      return error;
    }
  }

  getCertificate(req: HullRequest): Promise {
    const certUrl =
      req.headers["x-hull-smart-notifier-signature-public-key-url"];
    const signature = req.headers["x-hull-smart-notifier-signature"];
    if (_.has(certCache, certUrl)) {
      return Promise.resolve(_.get(certCache, certUrl));
    }
    return new Promise((resolve, reject) => {
      this.httpClient.post(
        certUrl,
        {
          body: signature
        },
        (error, response, body) => {
          if (error) {
            return reject(error);
          }
          if (!body.match("-----BEGIN PUBLIC KEY-----")) {
            return reject(
              new NotificationValidationError(
                "Invalid certificate",
                "INVALID_CERTIFICATE"
              )
            );
          }
          certCache[certUrl] = body;
          return resolve(body);
        }
      );
    });
  }
}

module.exports = NotificationValidator;
