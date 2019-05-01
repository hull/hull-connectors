// @flow

class SkippableError extends Error {
  extra: Object;

  code: string;

  constructor(message: string, extra?: Object = {}) {
    super(message);
    this.name = "SkippableError";
    this.code = "";
    this.extra = extra;
    Error.captureStackTrace(this, SkippableError);
  }
}

module.exports = SkippableError;
