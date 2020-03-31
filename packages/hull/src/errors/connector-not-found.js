// @flow

/**
 * This error means that Hull did not find the connector you asked for.
 * We frequently have this error when Outreach sends invalid webhooks
 * for the wrong org.
 *
 * @public
 * @memberof Errors
 */
class ConnectorNotFoundError extends Error {
  extra: Object;

  code: string;

  status: number;

  constructor(message: string, extra?: Object = {}) {
    super(message);
    this.name = "ConnectorNotFoundError"; // compatible with http-errors library
    this.code = "HULL_CONNECTOR_NOT_FOUND"; // compatible with internal node error
    this.extra = extra;
    this.status = 404;

    Error.captureStackTrace(this, ConnectorNotFoundError);
  }
}

module.exports = ConnectorNotFoundError;
