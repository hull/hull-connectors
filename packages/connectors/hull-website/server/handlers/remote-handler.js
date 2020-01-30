// @flow

const uuid = require("uuid/v1");

const HULL_JS_URL = "https://js.hull.io/0.10.0/hull.js.gz";
const TEN_YEARS = 18 * 365 * 24 * 3600000;
const THIRTY_MINUTES = 1800000;

const buildConfig = ({ appId, browserId, sessionId }) => {
  return {
    appId,
    appDomains: "*",
    data: {
      org: {},
      me: { id: browserId },
      app: {
        id: appId,
        track_page_inits: false,
        deployments: []
      }
    },
    services: { settings: {}, types: {} },
    is_admin: false,
    batching: { min: 10000, max: 1, delay: 0 },
    identify: { browser: browserId, session: sessionId }
  };
};

const remoteHandler = (req, res) => {
  const appId = req.params.id;
  const browserId = req.cookies._bid || uuid();
  const sessionId = req.cookies._sid || uuid();

  const config = buildConfig({ appId, browserId, sessionId });

  res.cookie("_bid", browserId, {
    secure: true,
    sameSite: "None",
    maxAge: TEN_YEARS,
    httpOnly: true
  });

  res.cookie("_sid", sessionId, {
    secure: true,
    sameSite: "None",
    maxAge: THIRTY_MINUTES,
    httpOnly: true
  });

  res.status(200).send(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Hull Remote</title>
          <script src="${HULL_JS_URL}"></script>
          <script>Hull.initRemote(${JSON.stringify(config)});</script>
        </head>
      </html>`);
};

export default remoteHandler;
