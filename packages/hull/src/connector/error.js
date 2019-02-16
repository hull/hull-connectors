// @flow
import type { $Response, NextFunction } from "express";
import Hull from "..";
import type { HullRequestFull } from "../types";

const debug = require("debug")("hull-error");

type CustomError = Error & {
  status?: number,
  message?: string
};
const errorHandler = (
  err: CustomError,
  req: HullRequestFull,
  res: $Response,
  _next: NextFunction
) => {
  // eslint-disable-line no-unused-vars
  if (err) {
    const data = {
      status: err.status,
      method: req.method,
      headers: req.headers,
      url: req.url,
      params: req.params
    };
    Hull.Client.logger.error("Error ----------------", {
      message: err.message,
      status: err.status,
      data,
      stack: err.stack
    });

    // eslint-disable-line no-unused-vars
    if (!res.headersSent) {
      return res.status(err.status || 500).send({ message: err.message });
    }
  }
  debug("unhandled-error", err.stack);
  return res.status(err.status || 500).send({ message: "undefined error" });
};

export default errorHandler;
