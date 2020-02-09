// @flow

/**
 * This is a missing channel error related to receving a notification for a channel we don't have a handler for.
 *
 * @public
 * @memberof Errors
 */
class MissingHandlerError extends Error {
  extra: Object;

  code: string;

  status: number;

  constructor(message: string, extra?: Object = {}) {
    super(message);
    this.name = "MissingHandlerError"; // compatible with http-errors library
    this.code = "HULL_ERR_MISSING_CHANNEL"; // compatible with internal node error
    this.extra = extra;
    this.status = 404;

    Error.captureStackTrace(this, MissingHandlerError);
  }
}

module.exports = MissingHandlerError;
