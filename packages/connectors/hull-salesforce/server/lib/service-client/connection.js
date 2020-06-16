/* @flow */
import type { IMetricsClient, ILogger } from "../types";

const jsforce = require("jsforce");
const _ = require("lodash");

class Connection extends jsforce.Connection {
  /**
   * Gets or sets the connector identfier.
   *
   * @type {string}
   * @memberof Connection
   */
  _connectorId: string;

  /**
   * Gets or sets the logger.
   *
   * @type {ILogger}
   * @memberof Connection
   */
  _hullLogger: ILogger;

  /**
   * Gets or sets the client for metrics.
   *
   * @type {IMetricsClient}
   * @memberof Connection
   */
  _metrics: IMetricsClient;

  /**
   * Sets the identifier of the connector.
   *
   * @param {string} id
   * @memberof Connection
   */
  setConnectorId(id: string) {
    this._connectorId = id;
  }

  /**
   * Sets the logger to use.
   *
   * @param {ILogger} logger The logger instance to use.
   * @memberof Connection
   */
  setLogger(logger: ILogger) {
    this._hullLogger = logger;
  }

  /**
   * Sets the client to use for reporting metrics.
   *
   * @param {IMetricsClient} metric The metrics client to use.
   * @memberof Connection
   */
  setMetric(metric: IMetricsClient) {
    this._metrics = metric;
  }

  /**
   * Performs a request.
   *
   * @param {any} request The request to perform
   * @param {any} options The options for the request
   * @param {any} callback The callback to invoke
   * @returns {any} The request
   * @memberof Connection
   */
  request(request: Object, options: Object, callback: Function) {
    if (this._metrics) {
      this._metrics.increment("ship.service_api.call", 1);
    }

    const ret = super.request(request, options, callback);

    if (_.isString(request)) {
      request = { method: "GET", url: request };
    }

    const url = _.get(request, "url", "");
    const truncatedUrl = (url.length > 500)
      ? `${_.truncate(url, { length: 500, omission: "[...]" })}${url.slice(-3)}`
      : url;
    if (this._hullLogger) {
      this._hullLogger.debug("ship.service_api.request", {
        method: request.method,
        url_length: url.length,
        url: truncatedUrl
      });
    }

    ret.then(() => {
      if (this.limitInfo && this.limitInfo.apiUsage && this._metrics) {
        this._metrics.value("ship.service_api.limit", this.limitInfo.apiUsage.limit);
        this._metrics.value("ship.service_api.remaining", (this.limitInfo.apiUsage.limit - this.limitInfo.apiUsage.used));
      }
    }, () => {
      if (this._metrics) {
        this._metrics.increment("ship.service_api.errors", 1);
      }
    });
    return ret;
  }
}

module.exports = Connection;
