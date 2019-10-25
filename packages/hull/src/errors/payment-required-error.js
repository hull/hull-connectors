// @flow

/**
 * This error means that the connected organization is disabled.
 * This error is happening when web-hooks are still active
 * like in Mailchimp, and are sending data to deactivated organizations.
 *
 * @public
 * @memberof Errors
 */
class PaymentRequiredError extends Error {
  extra: Object;

  code: string;

  constructor(message: string, extra?: Object = {}) {
    super(message);
    this.name = "PaymentRequiredError";
    this.code = "";
    this.extra = extra;
    Error.captureStackTrace(this, PaymentRequiredError);
  }
}

module.exports = PaymentRequiredError;
