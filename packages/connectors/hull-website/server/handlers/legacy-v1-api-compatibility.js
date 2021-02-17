/* eslint-disable max-classes-per-file */
import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import HullClient from "hull-client/src";
import uuid from "uuid/v1";
import aliasHandler from "./alias-handler";
import trackHandler from "./track-handler";
import traitsHandler from "./traits-handler";
import remoteHandler from "./remote-handler";
import redirectHandler from "./redirect-handler";

const ONE_YEAR = 365 * 24 * 3600000;
const THIRTY_MINUTES = 1800000;

class RemoteDomainMismatchError extends Error {
  status = 403;

  stack = [];

  message = "Remote domain mismatch";

  constructor(domain) {
    super();
    this.stack = [`Remote domain mismatch: ${domain}`];
  }
}

class UnauthorizedDomainError extends Error {
  status = 403;

  stack = [];

  message = "Unauthorized domain";

  constructor(domain) {
    super();
    this.stack = [`Unauthorized domain: ${domain}`];
  }
}

function parseOriginHost(origin) {
  if (!origin) return null;
  try {
    return new URL(origin).host;
  } catch (e) {
    return null;
  }
}

export default (firehoseTransport, HULL_DOMAIN, REMOTE_DOMAIN) => {
  const app = Router();

  app.use(cookieParser());

  app.use((req, res, next) => {
    const [namespace, ...remoteDomain] = req.hostname.split(".");
    req.organization = `${namespace}.${HULL_DOMAIN}`;
    req.orgNamespace = namespace;
    if (remoteDomain.join(".") !== REMOTE_DOMAIN) {
      return next(new RemoteDomainMismatchError(req.hostname));
    }
    return next();
  });

  app.use(
    cors((req, callback) => {
      const originHost = parseOriginHost(req.header("origin"));
      if (originHost) {
        const allowedHeaders = [
          "content-type",
          "hull-access-token",
          "hull-app-id",
          "hull-bid",
          "hull-sid",
          "hull-user-id",
          "x-track-url",
          "x-track-referer"
        ];
        if (
          originHost === `${req.orgNamespace}.${HULL_DOMAIN}` ||
          originHost === `${req.orgNamespace}.${REMOTE_DOMAIN}`
        ) {
          return callback(null, { origin: true, allowedHeaders });
        }

        return callback(new UnauthorizedDomainError(req.organization), {
          origin: false,
          originHost
        });
      }

      return callback(null, { origin: false });
    })
  );

  app.use((req, res, next) => {
    const remoteUrl = req.query.url
      ? new URL(req.query.url)
      : new URL(req.url, `https://${res.hostname}`);

    let browserId =
      req.get("hull-bid") ||
      remoteUrl.searchParams.get("_bid") ||
      req.cookies._bid;
    let sessionId =
      req.get("hull-sid") ||
      remoteUrl.searchParams.get("_sid") ||
      req.cookies._sid;
    if (!browserId) {
      browserId = uuid();

      res.cookie("_bid", browserId, {
        secure: true,
        sameSite: "None",
        maxAge: ONE_YEAR,
        httpOnly: true
      });
    }

    if (!sessionId) {
      sessionId = uuid();

      res.cookie("_sid", sessionId, {
        secure: true,
        sameSite: "None",
        maxAge: THIRTY_MINUTES,
        httpOnly: true
      });
    }
    req["hull-bid"] = browserId;
    req["hull-sid"] = sessionId;
    next();
  });

  app.get("/:id/remote.html", remoteHandler());

  app.use((req, res, next) => {
    const appId = req.get("hull-app-id") || req.query["hull-app-id"];
    const anonymous_id =
      req.get("hull-bid") || req.cookies._bid || req["hull-bid"];
    const remoteUrl = req.get("referer");
    const clientParams = {
      id: appId,
      organization: req.organization,
      trackingOnly: true,
      firehoseTransport
    };

    const accessToken =
      req.get("hull-access-token") ||
      (remoteUrl &&
        remoteUrl.match(HULL_DOMAIN) &&
        new URL(remoteUrl).searchParams.get("access_token"));

    if (accessToken) {
      clientParams.accessToken = accessToken;
      req.hull = new HullClient(clientParams).asUser({}, { active: true });
    } else {
      req.hull = new HullClient(clientParams).asUser(
        { anonymous_id },
        { active: true }
      );
    }

    req.firehoseEventContext = {
      sessionId: req.get("hull-sid") || req.cookies._sid || req["hull-sid"],
      ip: req.ip,
      useragent: req.get("user-agent"),
      created_at: Date.now(),
      url: req.body.url || req.get("x-track-url"),
      referer: req.body.referer || req.get("x-track-referer")
    };

    next();
  });

  // Legacy hull-js tracking routes

  function firehoseResponder(actionHandler) {
    return async (req, res) => {
      try {
        await actionHandler(req);
        res.status(204).send({ ok: true });
      } catch (error) {
        res.status(error.status || 503).send({ error });
      }
    };
  }

  app.post("/r", redirectHandler);
  app.post("/t", firehoseResponder(trackHandler));
  app.put("/me/traits", firehoseResponder(traitsHandler));
  app.post("/me/alias", firehoseResponder(aliasHandler));
  return app;
};
