// @flow
import type { Router } from "express";
import type {
  HullRequest,
  HullResponse,
  HullStatusHandlerConfigurationEntry,
  HullStatusResponse
} from "hull";
import getRouter from "../get-router";
import errorHandler from "../error-handler";

// const STATUS_MAP = {
//   ok: 0,
//   warning: 1,
//   error: 2
// };
//
/**
 * @param {Array} checks
 * @example
 * app.use("/status", statusHandler([
 * (ctx) => {
 *   return Promise.resolve({
 *     status: "ok|error|warning",
 *     message: "Error Message"
 *   });
 * }
 * ]));
 */
// @TODO: Finish wiring up this handler with a unified middleware stack
function statusHandlerFactory(
  configurationEntry: HullStatusHandlerConfigurationEntry
): Router {
  const { options = {}, callback } = configurationEntry;

  async function handler(req: HullRequest, res: HullResponse) {
    try {
      const response: HullStatusResponse = await callback(req.hull);
      res.json(response);
      // const globalStatus = _.max(
      //   _.map(responses, s => STATUS_MAP[s.status] || 2)
      // );
      // const messages = _.map(responses, s => s.message || "");
      // res.json({
      //   messages,
      //   status: _.invert(STATUS_MAP)[globalStatus] || "error"
      // });
    } catch (err) {
      res.status(500).json({
        status: "error"
      });
    }
  }
  return getRouter({
    options: {
      credentialsFromQuery: true,
      credentialsFromNotification: false,
      respondWithError: true,
      strict: true,
      ...options
    },
    requestName: "status",
    errorHandler,
    handler
  });
}

module.exports = statusHandlerFactory;
