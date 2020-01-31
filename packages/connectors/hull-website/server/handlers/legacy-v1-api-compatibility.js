import cookieParser from "cookie-parser";
import { Router } from "express";
import HullClient from "hull-client/src";
import aliasHandler from "./alias-handler";
import trackHandler from "./track-handler";
import traitsHandler from "./traits-handler";
import remoteHandler from "./remote-handler";

export default (firehoseTransport, HULL_DOMAIN) => {
  const app = Router();

  app.use(cookieParser());

  app.get("/:id/remote.html", remoteHandler(HULL_DOMAIN));

  app.use((req, res, next) => {
    const appId = req.get("hull-app-id");
    const anonymous_id = req.cookies._bid;
    const namespace = new URL(req.get("origin")).hostname.split(".")[0];
    const organization = `${namespace}.${HULL_DOMAIN}`;
    const remoteUrl = req.get("referer");
    const clientParams = {
      id: appId,
      organization,
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
