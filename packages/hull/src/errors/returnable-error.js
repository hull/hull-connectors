// @flow

/**
 * This error is used mostly for front-end related work
 * Sometimes the error from a request can be used to display a message
 */

class ReturnableError extends Error {
  extra: Object;

  status: number;

  code: string;

  constructor(message: string, extra?: Object = {}) {
    super(message);
    this.name = "ReturnableError";
    this.code = "";
    this.extra = extra;
    Error.captureStackTrace(this, ReturnableError);
  }
}

module.exports = ReturnableError;
