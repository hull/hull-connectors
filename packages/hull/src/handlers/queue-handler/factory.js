// @flow
import type { NextFunction, $Response } from "express";
import type { HullRequest } from "../../types";

const { Router } = require("express");

const {
  credentialsFromQueryMiddleware,
  clientMiddleware,
  helpersMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

/**
 * This handler allows to handle simple, authorized HTTP calls.
 * By default it picks authorization configuration from query.
 *
 * If you need custom way of passing data, you need to use custom middleware before the handler.
 *
 * Optionally it can cache the response, then provide options.cache object with key
 *
 * @param  {string} jobName [description]
 * @param  {Object}   [options]
 * @param  {Object}   [options.cache]
 * @param  {string}   [options.cache.key]
 * @param  {string}   [options.cache.options]
 * @return {Function}
 * @example
 * app.use("/list", actionHandler((ctx) => {}))
 */
function actionHandler(jobName: string, options: Object) {
  const router = Router();
  router.use(credentialsFromQueryMiddleware()); // parse config from query
  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client
  router.use(helpersMiddleware()); // initialize client
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "action" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(async (req: HullRequest, res: $Response, next: NextFunction) => {
    try {
      await req.hull.enqueue(jobName, {}, options);
      res.end("qeueued");
    } catch (error) {
      next(error);
    }
  });
  router.use(
    (err: Error, req: HullRequest, res: $Response, _next: NextFunction) => {
      res.status(500).end("error");
    }
  );

  return router;
}

module.exports = actionHandler;
