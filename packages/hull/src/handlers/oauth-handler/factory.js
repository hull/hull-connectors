// @flow
import type {
  HullRouteMap,
  HullRequest,
  HullResponse,
  HullOAuthHandlerParams,
  HullOAuthHandlerOptions
} from "hull";
import type { NextFunction, $Response } from "express";
import getRouter from "../get-router";

const _ = require("lodash");

const passport = require("passport");
const querystring = require("querystring");
const debug = require("debug")("hull-connector:oauth-handler");

const HOME_URL = "";
const LOGIN_URL = "/login";
const CALLBACK_URL = "/callback";
const FAILURE_URL = "/failure";
const SUCCESS_URL = "/success";

/**
 * OAuthHandler is a packaged authentication handler using [Passport](http://passportjs.org/). You give it the right parameters, it handles the entire auth scenario for you.
 *
 * It exposes hooks to check if the ship is Set up correctly, inject additional parameters during login, and save the returned settings during callback.
 *
 * To make it working in Hull dashboard set following line in **manifest.json** file:
 *
 * ```json
 * {
 *   "admin": "/auth/"
 * }
 * ```
 *
 * For example of the notifications payload [see details](./notifications.md)
 *
 * @name OAuthHandler
 * @memberof Utils
 * @public
 * @param  {Object}    options
 * @param  {string}    options.name        The name displayed to the User in the various screens.
 * @param  {boolean}   options.tokenInUrl  Some services (like Stripe) require an exact URL match. Some others (like Hubspot) don't pass the state back on the other hand. Setting this flag to false (default: true) removes the `token` Querystring parameter in the URL to only rely on the `state` param.
 * @param  {Function}  options.isSetup     A method returning a Promise, resolved if the ship is correctly setup, or rejected if it needs to display the Login screen.
 * Lets you define in the Ship the name of the parameters you need to check for. You can return parameters in the Promise resolve and reject methods, that will be passed to the view. This lets you display status and show buttons and more to the customer
 * @param  {Function}  options.onAuthorize A method returning a Promise, resolved when complete. Best used to save tokens and continue the sequence once saved.
 * @param  {Function}  options.onLogin     A method returning a Promise, resolved when ready. Best used to process form parameters, and place them in `req.authParams` to be submitted to the Login sequence. Useful to add strategy-specific parameters, such as a portal ID for Hubspot for instance.
 * @param  {Function}  options.Strategy    A Passport Strategy.
 * @param  {Object}    options.views       Required, A hash of view files for the different screens: login, home, failure, success
 * @param  {Object}    options.options     Hash passed to Passport to configure the OAuth Strategy. (See [Passport OAuth Configuration](http://passportjs.org/docs/oauth))
 * @return {Function} OAuth handler to use with expressjs
 * @example
 * const { OAuthHandler } = require("hull/lib/utils");
 * const { Strategy as HubspotStrategy } = require("passport-hubspot");
 *
 * const app = express();
 *
 * app.use(
 *   '/auth',
 *   OAuthHandler({
 *    callback: () => ({
 *      Strategy: HubspotStrategy,
 *      isSetup () => {},,
 *      onAuthorize () => {},
 *      onLogin; () => {},
 *      clientID: xxx,
 *      clientSecret: xxx
 *    }),
 *    options: {
 *      tokenInUrl: true,
 *      name: "outreach",
 *      strategy: {
 *        authorizationURL: "https://xxx",
 *        tokenURL: "https://xxx",
 *        grant_type: "authorization_code",
 *        scope: ['offline', 'contacts-rw', 'events-rw']
 *      },
 *      views: {
 *        login:"login.html"
 *        home:"home.html"
 *        failure:"failure.html"
 *        success:"success.html"
 *      }
 *    } : HullOAuthHandlerParams
 * );
 *
 * //each view will receive the following data:
 * {
 *   name: "The name passed as handler",
 *   urls: {
 *     login: '/auth/login',
 *     success: '/auth/success',
 *     failure: '/auth/failure',
 *     home: '/auth/home',
 *   },
 *   ship: ship //The entire Ship instance's config
 * }
 */

function fetchToken(req: HullRequest, res: $Response, next: NextFunction) {
  const token: string = (req.query.token || req.query.state || "").toString();
  if (token && token.split(".").length === 3) {
    req.hull = req.hull || {};
    req.hull.clientCredentialsToken = token;
  }
  next();
}
function getURL(req, url, qs = { token: req.hull.clientCredentialsToken }) {
  const host = `https://${req.hostname}${req.baseUrl}${url}`;
  if (qs === false) return host;
  return `${host}?${querystring.stringify(qs)}`;
}
function getURLs(req) {
  return {
    login: getURL(req, LOGIN_URL),
    success: getURL(req, SUCCESS_URL),
    failure: getURL(req, FAILURE_URL),
    home: getURL(req, HOME_URL)
  };
}
function OAuthHandlerFactory({
  options: opts,
  callback
}: {
  options: {
    params: HullOAuthHandlerOptions
  },
  callback: () => HullOAuthHandlerParams
}): void | HullRouteMap {
  const { params } = opts;
  const handlerParams = callback();
  if (!handlerParams) {
    return undefined;
  }
  const {
    Strategy,
    isSetup = _req => Promise.resolve(),
    onAuthorize = _req => Promise.resolve(),
    onLogin = _req => Promise.resolve(),
    clientID,
    clientSecret
  } = handlerParams;
  const { tokenInUrl, name, strategy, views } = params;
  const { router } = getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      strict: false
    },
    requestName: "OAuth",
    bodyParser: "urlencoded",
    beforeMiddlewares: [fetchToken],
    afterMiddlewares: [passport.initialize()]
    // disableErrorHandling: false
  });

  const OAuthStrategy = new Strategy(
    {
      ...strategy,
      clientID,
      clientSecret,
      passReqToCallback: true
    },
    function verifyAccount(
      req: HullRequest,
      accessToken: string,
      refreshToken: string,
      veryfyParams: any,
      profile: (any, any) => any,
      done?: (any, any) => any
    ) {
      if (done === undefined) {
        done = profile;
        profile = veryfyParams;
        veryfyParams = undefined;
      }
      done(undefined, {
        accessToken,
        refreshToken,
        params: veryfyParams,
        profile
      });
    }
  );

  passport.serializeUser((req, user, done) => {
    req.user = user;
    done(null, user);
  });

  passport.use(OAuthStrategy);

  router.get(HOME_URL, async function home(
    req: HullRequest,
    res: HullResponse
  ) {
    const { connector = {}, client } = req.hull;
    client.logger.debug("connector.oauth.home");
    const data = { name, urls: getURLs(req), connector };
    try {
      const setupResponse = await isSetup(req);
      const { status, data: setupData } = setupResponse;
      if (status >= 400) {
        throw new Error(setupResponse);
      }
      res.render(views.home, { ...data, ...setupData });
    } catch (error) {
      res.render(views.login, { ...data, ...error.data });
    }
  });

  function authorize(req: HullRequest, res: HullResponse, next: NextFunction) {
    passport.authorize(
      OAuthStrategy.name,
      _.merge({}, req.hull.authParams, {
        callbackURL: getURL(
          req,
          CALLBACK_URL,
          tokenInUrl ? { token: req.hull.clientCredentialsToken } : false
        )
      })
    )(req, res, next);
  }

  router.all(
    LOGIN_URL,
    async (req: HullRequest, res: HullResponse, next: NextFunction) => {
      const { client } = req.hull;
      client.logger.debug("connector.oauth.login");
      try {
        await onLogin(req);
        next();
      } catch (err) {
        next();
      }
    },
    (req: HullRequest, res: HullResponse, next: NextFunction) => {
      req.hull.authParams = _.merge({}, req.hull.authParams, {
        state: req.hull.clientCredentialsToken
      });
      next();
    },
    authorize
  );

  router.get(FAILURE_URL, function loginFailue(
    req: HullRequest,
    res: HullResponse
  ) {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.failure");
    return res.render(views.failure, { name, urls: getURLs(req) });
  });

  router.get(SUCCESS_URL, function login(req: HullRequest, res: HullResponse) {
    const { client } = req.hull;
    client.logger.debug("connector.oauth.success");
    return res.render(views.success, { name, urls: getURLs(req) });
  });

  router.get(
    CALLBACK_URL,
    authorize,
    async (req: HullRequest, res: HullResponse) => {
      const { client } = req.hull;
      client.logger.debug("connector.oauth.authorize");
      try {
        await onAuthorize(req);
        res.redirect(getURL(req, SUCCESS_URL));
      } catch (error) {
        console.log("CALLBACK ERROR", error);
        res.redirect(
          getURL(req, FAILURE_URL, {
            token: req.hull.clientCredentialsToken,
            error: error.message
          })
        );
      }
    }
  );

  router.use(
    (error, req: HullRequest, res: HullResponse, _next: NextFunction) => {
      debug("error", error);
      const { client } = req.hull;
      if (client) {
        client.logger.error("connector.oauth.error", error);
      }
      return res.render(views.failure, {
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
