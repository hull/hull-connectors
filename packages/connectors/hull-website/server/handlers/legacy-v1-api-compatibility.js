import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";

import HullClient from "hull-client/src";
import aliasHandler from "./alias-handler";
import trackHandler from "./track-handler";
import traitsHandler from "./traits-handler";
import remoteHandler from "./remote-handler";

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
      const origin = req.header("origin");
      if (origin) {
        const originHost = new URL(req.header("origin")).host;
        const allowedHeaders = [
          "content-type",
          "hull-app-id",
          "hull-bid",
          "hull-sid"
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

  app.get("/:id/remote.html", remoteHandler());

  app.use((req, res, next) => {
    const appId = req.get("hull-app-id");
    const anonymous_id = req.get("hull-bid") || req.cookies._bid;
    const remoteUrl = req.get("referer");
    const clientParams = {
      id: appId,
      organization: req.organization,
      trackingOnly: true,
      firehoseTransport
    };

    const accessToken = new URL(remoteUrl).searchParams.get("access_token");
    if (accessToken) {
      clientParams.accessToken = accessToken;
      req.hull = new HullClient(clientParams).asUser({}, { active: true });
    } else {
      req.hull = new HullClient(clientParams).asUser(
        { anonymous_id },
        { active: true }
      );
    }

    const { url, referer } = req.body;

    req.firehoseEventContext = {
      sessionId: req.get("hull-sid") || req.cookies._sid,
      ip: req.ip,
      useragent: req.get("user-agent"),
      created_at: Date.now(),
      url,
      referer
    };

    next();
  });

  // Legacy hull-js tracking routes
  app.post("/t", trackHandler);
  app.put("/me/traits", traitsHandler);
  app.post("/me/alias", aliasHandler);
  return app;
};
