// @flow
import type {
  HullRouteMap,
  HullRequest,
  HullResponse,
  HullOAuthRequest,
  HullOAuthHandlerParams,
  HullOAuthHandlerOptions
} from "hull";
import type { NextFunction, $Response } from "express";
import getRouter from "../get-router";
import getMessage from "../../utils/get-message-from-request";

const _ = require("lodash");
const cors = require("cors");
const passport = require("passport");
const querystring = require("querystring");
const debug = require("debug")("hull-connector:oauth-handler");

// const HOME_URL = "";
const LOGIN_URL = "/";
const CALLBACK_URL = "/callback";
const STATUS_URL = "/status";
const FAILURE_URL = "/failure";
const SUCCESS_URL = "/success";

const FAILURE_VIEW = "../../../assets/partials/login-failed.ejs";
const SUCCESS_VIEW = "../../../assets/partials/login-successful.ejs";
function fetchToken(req: HullRequest, res: $Response, next: NextFunction) {
  const token: string = (req.query.token || req.query.state || "").toString();
  if (token && token.split(".").length === 3) {
    req.hull = req.hull || {};
    req.hull.clientCredentialsEncryptedToken = token;
  }
  next();
}
function getURL(
  req,
  url,
  qs = { token: req.hull.clientCredentialsEncryptedToken }
) {
  const host = `https://${req.hostname}${req.baseUrl}${url}`;
  if (qs === false) return host;
  return `${host}?${querystring.stringify(qs)}`;
}
function getURLs(req) {
  return {
    login: getURL(req, LOGIN_URL),
    success: getURL(req, SUCCESS_URL),
    failure: getURL(req, FAILURE_URL)
    // home: getURL(req, HOME_URL)
  };
}

const noopPromise = (_ctx, _message) => Promise.resolve({});
function OAuthHandlerFactory({
  options: opts,
  callback
}: {
  options: HullOAuthHandlerOptions,
  callback: () => HullOAuthHandlerParams
}): void | HullRouteMap {
  if (!opts.strategy) {
    return undefined;
  }
  const handlerParams = callback();
  if (!handlerParams) {
    return undefined;
  }

  const {
    Strategy,
    onAuthorize = noopPromise,
    onLogin = noopPromise,
    onStatus = noopPromise,
    clientID,
    clientSecret
  } = handlerParams;

  const { tokenInUrl, name, strategy } = opts;
  const { router } = getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      strict: false
    },
    requestName: "OAuth",
    bodyParser: "urlencoded",
    beforeMiddlewares: [fetchToken, cors()],
    afterMiddlewares: [passport.initialize()]
    // disableErrorHandling: false
  });

  const { authorizationURL, tokenURL, name: strategyName } = strategy;

  function authorize(req: HullRequest, res: HullResponse, next: NextFunction) {
    const oauth_url = req.hull.connector.private_settings[
      `${_.toLower(name)}_oauth_url`
    ].replace(/\/$/, "");

    const OAuthStrategy = new Strategy(
      {
        ...strategy,
        authorizationURL: `${oauth_url}/${authorizationURL}`,
        tokenURL: `${oauth_url}/${tokenURL}`,
        clientID,
        clientSecret,
        passReqToCallback: true
      },
      function verifyAccount(
        req1: HullRequest,
        accessToken: string,
        refreshToken: string,
        verifyParams: any,
        profile: (any, any) => any,
        done?: (any, any) => any
      ) {
        if (done === undefined) {
          done = profile;
          profile = verifyParams;
          verifyParams = undefined;
        }
        done(undefined, {
          accessToken,
          refreshToken,
          params: verifyParams,
          profile
        });
      }
    );

    passport.serializeUser((req1, user, done) => {
      req1.user = user;
      done(null, user);
    });

    passport.use(OAuthStrategy);

    passport.authorize(strategyName, {
      ...req.hull.authParams,
      failureFlash: true,
      failureRedirect: getURL(
        req,
        FAILURE_URL,
        tokenInUrl ? { token: req.hull.clientCredentialsToken } : false
      ),
      callbackURL: getURL(
        req,
        CALLBACK_URL,
        tokenInUrl ? { token: req.hull.clientCredentialsToken } : false
      )
    })(req, res, next);
  }

  /* Redirects to Service's Auth Page */
  router.all(
    LOGIN_URL,
    async (req: HullRequest, res: HullResponse, next: NextFunction) => {
      const message = getMessage(req);
      const { hull: ctx } = req;
      ctx.client.logger.debug("connector.oauth.login");
      try {
        const authParams = await onLogin(ctx, message);
        req.hull.authParams = {
          ...authParams,
          state: req.hull.clientCredentialsEncryptedToken
        };
        next();
      } catch (err) {
        next(err);
      }
    },
    authorize
  );

  router.all(
    STATUS_URL,
    async (req: HullRequest, res: HullResponse, next: NextFunction) => {
      try {
        const message = getMessage(req);
        const { hull: ctx } = req;
        const statusResponse = await onStatus(ctx, message);
        const { status = 200, data } = statusResponse || {};
        res.status(status).send(data);
        next();
      } catch (err) {
        res.json({ error: err.message });
        next(err);
      }
    }
  );
  /* failed auth */
  router.get(
    FAILURE_URL,
    function failure(req: HullRequest, res: HullResponse) {
      const { client } = req.hull;
      client.logger.debug("connector.oauth.failure", req.body);
      return res.render(FAILURE_VIEW, { name, urls: getURLs(req) });
    }
  );

  /* receives the data from the services, saves it and redirects to next step */
  router.get(
    CALLBACK_URL,
    authorize,
    async (req: HullOAuthRequest, res: HullResponse) => {
      const { hull: ctx, account } = req;
      const { client } = ctx;
      const message = {
        ...getMessage(req),
        account
      };
      client.logger.debug("connector.oauth.authorize");
      try {
        const authResponse = await onAuthorize(ctx, message);
        const {
          private_settings
          // , settings
        } = authResponse || {};
        if (private_settings) {
          await ctx.helpers.settingsUpdate(private_settings, true);
        }
        res.redirect(getURL(req, SUCCESS_URL));
      } catch (error) {
        console.log("CALLBACK ERROR", error);
        res.redirect(
          getURL(req, FAILURE_URL, {
            token: ctx.clientCredentialsToken,
            error: error.message
          })
        );
      }
    }
  );

  /* successful auth */
  router.get(
    SUCCESS_URL,
    function success(req: HullRequest, res: HullResponse) {
      const { client } = req.hull;
      client.logger.debug("connector.oauth.success");
      return res.render(SUCCESS_VIEW, { name, urls: getURLs(req) });
    }
  );

  /* Error Handler */
  router.use(
    (error, req: HullRequest, res: HullResponse, _next: NextFunction) => {
      debug("error", error);
      const { client } = req.hull;
      if (client) {
        client.logger.error("connector.oauth.error", error);
      }
      return res.render(FAILURE_VIEW, {
        name,
        urls: getURLs(req),
        error: error.message || error.toString() || ""
      });
    }
  );

  return {
    method: "use",
    router
  };
}

module.exports = OAuthHandlerFactory;
