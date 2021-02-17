// @flow

import { v1 as uuid } from "uuid";

import Hull from "hull-client/src";
import cacheManager from "cache-manager";

const HULL_JS_URL = "https://js.hull.io/0.10.0/hull.js.gz";
const ONE_YEAR = 365 * 24 * 3600000;
const THIRTY_MINUTES = 1800000;

const buildConfig = app => {
  return {
    appId: app.id,
    appDomains: "*",
    data: { org: {}, app },
    services: { settings: {}, types: {} },
    is_admin: false,
    batching: { min: 10000, max: 1, delay: 0 }
  };
};

function getRemoteConfigFromHullApi(organization, id) {
  return new Hull({ id, organization, secret: "none" }).get(
    `${id}/remote.json`
  );
}

async function fetchRemoteConfig(cache, organization: string, id: string) {
  return cache.wrap(`${organization}/${id}`, () =>
    getRemoteConfigFromHullApi(organization, id)
  );
}

function renderRemote(
  res,
  { allowed_domains = [], app },
  { browserId, sessionId }
) {
  res.status(200);
  const domains = allowed_domains.join(" ");
  res.set("Content-Security-Policy", `frame-ancestors 'self' ${domains}`);
  res.set("Cache-Control", "private, no-cache");
  res.set("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
  <head>
  <meta charset="utf-8">
  <title>Hull Remote</title>
  <script src="${HULL_JS_URL}"></script>
  <script>
    var searchParams = new URLSearchParams(document.location.search);
    var _bid = searchParams.get('_bid') || "${browserId}";
    var _sid = searchParams.get('_sid') || "${sessionId}";
    var config = ${JSON.stringify(buildConfig(app))};
    config.me = { id: _bid };
    config.identify = { browser: _bid, session: _sid };
    window.Hull.initRemote(config);
  </script>
  </head>
</html>`);
}

function renderError() {
  return "<script>// Remote failed to load</script>";
}

const remoteHandler = () => {
  const CACHE = cacheManager.caching({ store: "memory", max: 1000, ttl: 60 });
  return async (req, res) => {
    const appId = req.params.id;

    const remoteUrl = new URL(req.url, `https://${res.hostname}`);
    const browserId =
      remoteUrl.searchParams.get("_bid") || req.cookies._bid || uuid();
    const sessionId =
      remoteUrl.searchParams.get("_sid") || req.cookies._sid || uuid();

    res.cookie("_bid", browserId, {
      secure: true,
      sameSite: "None",
      maxAge: ONE_YEAR,
      httpOnly: true
    });

    res.cookie("_sid", sessionId, {
      secure: true,
      sameSite: "None",
      maxAge: THIRTY_MINUTES,
      httpOnly: true
    });

    try {
      const remoteConfig = await fetchRemoteConfig(
        CACHE,
        req.organization,
        appId
      );
      return renderRemote(res, remoteConfig, { browserId, sessionId });
    } catch (err) {
      return res.status(err.status || 500).send(renderError(err));
    }
  };
};

export default remoteHandler;
