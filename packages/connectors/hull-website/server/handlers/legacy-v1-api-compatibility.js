import cookieParser from "cookie-parser";
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
    next();
  });

  app.get("/:id/remote.html", remoteHandler());

  app.use((req, res, next) => {
    const appId = req.get("hull-app-id");
    const anonymous_id = req.cookies._bid;
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

    next();
  });

  // Legacy hull-js tracking routes
  app.post("/t", trackHandler);
  app.put("/me/traits", traitsHandler);
  app.post("/me/alias", aliasHandler);
  return app;
};
