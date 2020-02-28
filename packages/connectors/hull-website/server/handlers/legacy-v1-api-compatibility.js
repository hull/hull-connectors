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

export default (firehoseTransport, HULL_DOMAIN, REMOTE_DOMAIN) => {
  const app = Router();

  app.use(cookieParser());

  app.use((req, res, next) => {
    const [namespace, ...remoteDomain] = req.hostname.split(".");
    req.organization = `${namespace}.${HULL_DOMAIN}`;
    if (remoteDomain.join(".") !== REMOTE_DOMAIN) {
      return next(new RemoteDomainMismatchError(req.hostname));
    }
    return next();
  });

  app.use(
    cors((req, callback) => {
      const originHost = new URL(req.header("origin")).host;
      const allowedHeaders = [
        "content-type",
        "hull-app-id",
        "hull-bid",
        "hull-sid"
      ];
      if (originHost === req.organization) {
        return callback(null, { origin: true, allowedHeaders });
      }
      return callback(new Error("Unauthorized domain"), { origin: false });
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
      req.hull = new HullClient(clientParams).asUser({});
    } else {
      req.hull = new HullClient(clientParams).asUser({ anonymous_id });
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
