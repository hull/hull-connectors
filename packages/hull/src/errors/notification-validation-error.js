// @flow
class NotificationValidationError extends Error {
  code: string;

  status: number;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.status = 400;
    Error.captureStackTrace(this, NotificationValidationError);
  }
}
module.exports = NotificationValidationError;
