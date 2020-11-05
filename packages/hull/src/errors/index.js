// @flow
/* eslint-disable global-require */

/**
 * General utilities
 * @namespace Errors
 * @public
 */
module.exports = {
  ConfigurationError: require("./configuration-error"),
  RateLimitError: require("./rate-limit-error"),
  RecoverableError: require("./recoverable-error"),
  TransientError: require("./transient-error"),
  MissingHandlerError: require("./missing-handler-error"),
  ConnectorNotFoundError: require("./connector-not-found"),
  LogicError: require("./logic-error"),
  NotificationValidationError: require("./notification-validation-error"),
  ValidationError: require("./validation-error"),
  SkippableError: require("./skippable-error"),
  PaymentRequiredError: require("./payment-required-error"),
  ReturnableError: require("./returnable-error")
};
