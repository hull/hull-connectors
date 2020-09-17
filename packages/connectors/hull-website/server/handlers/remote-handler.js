// @flow

import Hull from "hull-client/src";
import cacheManager from "cache-manager";

const HULL_JS_URL = "https://js.hull.io/0.10.0/hull.js.gz";

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

function fetchRemoteConfig(cache, organization: string, id: string) {
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
    config.location = { referer: searchParams.get('r'), url: searchParams.get('url')  }
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
  return (req, res) => {
    const appId = req.params.id;

    const browserId = req["hull-bid"];
    const sessionId = req["hull-sid"];

    fetchRemoteConfig(CACHE, req.organization, appId).then(
      remoteConfig => renderRemote(res, remoteConfig, { browserId, sessionId }),
      err => res.status(err.status || 500).send(renderError(err))
    );
  };
};

export default remoteHandler;
