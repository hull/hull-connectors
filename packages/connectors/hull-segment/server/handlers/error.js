// @flow
import type { NextFunction, $Request, $Response } from "express";
import type { StatusError } from "../types";
const debug = require("debug")("hull-segment:error-handler");
type EnhancedRequest = $Request & {
  segment: any
};

module.exports = function(
  err: StatusError,
  req: EnhancedRequest,
  res: $Response,
  next: NextFunction
) {
  // eslint-disable-line no-unused-vars
  if (err) {
    const data = {
      status: err.status,
      segmentBody: req.segment,
      body: req.body,
      method: req.method,
      headers: req.headers,
      url: req.url,
      params: req.params
    };
    console.log("uncaught error", {
      message: err.message,
      status: err.status,
      data
    });
  }

  return res.status(err.status || 500).send({
    message: err.message
  });
};
