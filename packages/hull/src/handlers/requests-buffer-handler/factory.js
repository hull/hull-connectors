// @flow
import type { $Response, $Request, NextFunction } from "express";
import type { HullRequestFull, HullContextFull } from "../../types";

type HullRequestsBufferHandlerCallback = (
  ctx: HullContextFull,
  request: $Request
) => Promise<*>;
type HullRequestsBufferHandlerOptions = {
  maxSize?: number,
  maxTime?: number,
  disableErrorHandling?: boolean
};

const crypto = require("crypto");
const { Router } = require("express");
const debug = require("debug")("hull:requests-buffer-handler");

const {
  clientMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

const Batcher = require("../../infra/batcher");

/**
 * @param {Object|Function} callback         [description]
 * @param {Object}   options [description]
 * @param {number}   options.maxSize [description]
 * @param {number}   options.maxTime [description]
 */
function requestsBufferHandlerFactory(
  callback: HullRequestsBufferHandlerCallback,
  {
    maxSize = 100,
    maxTime = 10000,
    disableErrorHandling = false
  }: HullRequestsBufferHandlerOptions = {}
) {
  const uniqueNamespace = crypto.randomBytes(64).toString("hex");
  const router = Router();

  router.use(timeoutMiddleware());
  router.use(clientMiddleware()); // initialize client, we need configuration to be set already
  router.use(haltOnTimedoutMiddleware());
  router.use(instrumentationContextMiddleware());
  router.use(fullContextFetchMiddleware({ requestName: "requests-buffer" }));
  router.use(haltOnTimedoutMiddleware());
  router.use(function requestsBufferHandler(
    req: HullRequestFull,
    res: $Response,
    next: NextFunction
  ) {
    callback(req.hull, req)
      .then(result => {
        console.log(">>>>> !!!!! response", result);
        res.status(result.statusCode).json(result.json);
      })
      .catch(error => next(error));
      // .catch(error => );
      // .then(result => {
      //   console.log(">>>>> !!!!! response", result);
      //   res.status(result).json({ response: "ok" });
      // })
      // .catch(error => next(error));
    // Batcher.getHandler(uniqueNamespace, {
    //   ctx: req.hull,
    //   options: {
    //     maxSize,
    //     maxTime
    //   }
    // })
    //   .setCallback(requests => {
    //     return callback(req.hull, requests);
    //   })
    //   .addMessage({ body: req.body, query: req.query, method: req.method })
    //   .then(result => {
    //     console.log(">>>>> !!!!! response", result);
    //     res.status(200).json({ response: "ok" });
    //   })
    //   .catch(error => next(error));
  });

  if (disableErrorHandling !== true) {
    router.use(
      (
        err: Error,
        req: HullRequestFull,
        res: $Response,
        _next: NextFunction
      ) => {
        debug("error", err.stack);
        res.status(500).json({ response: "error" });
      }
    );
  }

  return router;
}

module.exports = requestsBufferHandlerFactory;
