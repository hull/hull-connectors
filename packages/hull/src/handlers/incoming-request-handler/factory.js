// @flow
import type { $Response, NextFunction } from "express";
import type {
  HullExternalHandlerConfigurationEntry,
  HullRequestFull
} from "../../types";

const { Router } = require("express");
const bodyParser = require("body-parser");
const debug = require("debug")("hull:requests-buffer-handler");

const {
  // credentialsFromQueryMiddleware,
  clientMiddleware,
  fullContextFetchMiddleware,
  timeoutMiddleware,
  haltOnTimedoutMiddleware,
  instrumentationContextMiddleware
} = require("../../middlewares");

/**
 * @param {Object|Function} callback         [description]
 * @param {Object}   options [description]
 * @param {number}   options.maxSize [description]
 * @param {number}   options.maxTime [description]
 */
function IncomingRequestHandlerFactory(
  configurationEntry: HullExternalHandlerConfigurationEntry
): Router {
  const router = Router();

  // <<<<<<< Updated upstream
  //   const { callback, options } = normalizeHandlersConfigurationEntry(
  //     configurationEntry
  //   );
  //   const {
  //     disableErrorHandling,
  //     parseCredentialsFromQuery,
  //     bodyParser: bodyParserOption
  //   } = options;
  //
  //   if (parseCredentialsFromQuery) {
  //     router.use(credentialsFromQueryMiddleware()); // parse config from query
  //   }
  // =======
  const { callback, options = {} } = configurationEntry;
  const { disableErrorHandling, bodyParser: bodyParserOption } = options;

  if (bodyParserOption === "json") {
    router.use(bodyParser.json({ type: "*/*" }));
  }

  if (bodyParserOption === "urlencoded") {
    router.use(bodyParser.urlencoded({ extended: true }));
  }

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
    // $FlowFixMe
    callback(req.hull, req)
      .then(result => {
        const { statusCode = 200 } = result;
        if (typeof result.json === "object") {
          res.status(statusCode).json(result.json);
        } else if (typeof result.text === "string") {
          res.status(statusCode).end(result.text);
        }
      })
      .catch(error => next(error));
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

module.exports = IncomingRequestHandlerFactory;
