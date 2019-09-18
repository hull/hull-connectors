/* @flow */
import type { TMadkuduMethod, TMadkuduAnalyticsCallType } from "../types";

const { TransientError } = require("hull/lib/errors");

class MadkuduError extends TransientError {
  /**
   * Gets or sets the API method that has caused the error.
   *
   * @type {(TMadkuduMethod | TSegmentAction)}
   * @memberof MadkuduError
   */
  method: TMadkuduMethod | TMadkuduAnalyticsCallType;

  /**
   * Gets or sets the inner exception.
   *
   * @type {Error}
   * @memberof MadkuduError
   */
  innerException: Error;

  /**
   * Creates an instance of MadkuduError.
   * @param {(TMadkuduMethod|TSegmentAction)} action The method name.
   * @param {Error} innerException The original exception.
   * @param {...any[]} params Default arguments.
   * @memberof MadkuduError
   */
  constructor(method: TMadkuduMethod | TMadkuduAnalyticsCallType, innerException: Error, ...params: any[]) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MadkuduError);
    }

    this.method = method;
    this.innerException = innerException;
  }
}

module.exports = MadkuduError;
