// @flow
import type { NextFunction } from "express";
// import Hull from "..";
import type { HullRequest, HullResponse } from "../types";

const debug = require("debug")("hull-error");

// type CustomError = {
//   ...Error,
//   status: number,
//   message?: string
// };
export default function error(Client) {
  return function errorHandler(
    err: Error,
    req: HullRequest,
    res: HullResponse,
    _next: NextFunction
  ) {
    // $FlowFixMe
    const { status = 500, message, stack } = err;
    if (message) {
      const { method, headers, url, params } = req;
      const data = {
        status,
        method,
        headers,
        url,
        params
      };
      Client.logger.error("connector.error", {
        message,
        status,
        data,
        stack
      });

      // eslint-disable-line no-unused-vars
      if (!res.headersSent) {
        return res.status(status).send({ message });
      }
      return null;
    }
    debug("unhandled-error", err.stack);
    if (!res.headersSent) {
      return res.status(status).send({ message: "undefined error" });
    }
    return undefined;
  };
}
